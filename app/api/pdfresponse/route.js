import { getPreviousProjects, saveProjectEstimate } from "@/firebase";

import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const calculateAdjustedTime = (originalTime, originalTeamSize, newTeamSize) => {
  if (!originalTime || !originalTeamSize || !newTeamSize) return 0;
  if (originalTeamSize === newTeamSize) return originalTime;
  
  const scalingFactor = 0.7; // Reduced from 0.8 for more realistic scaling
  const teamRatio = originalTeamSize / newTeamSize;
  const adjustedTime = originalTime * Math.pow(teamRatio, scalingFactor);
  
  // Ensure the adjusted time doesn't go below a reasonable minimum
  const minimumTime = originalTime * 0.3; // Never reduce time by more than 70%
  return Math.round(Math.max(adjustedTime, minimumTime));
};

const calculateWeightedAverageTime = (similarReferences, category) => {
  const relevantRefs = similarReferences.filter(ref => ref.category === category);
  if (relevantRefs.length === 0) return null;

  const totalWeight = relevantRefs.reduce((sum, ref) => sum + 1, 0);
  const weightedSum = relevantRefs.reduce((sum, ref) => sum + ref.adjusted_time, 0);
  
  return Math.round(weightedSum / totalWeight);
};

const normalizeTimeByTeamSize = (time, originalTeam, currentTeam) => {
  // Calculate total developers for both teams
  const originalDevCount = originalTeam.frontend + originalTeam.backend;
  const currentDevCount = currentTeam.frontend + currentTeam.backend;

  // Adjust time based on team size ratio (more developers = less time)
  const adjustedTime = (time * originalDevCount) / currentDevCount;
  return Math.round(adjustedTime);
};

const convertDaysToHours = (days) => days * 8; // Assuming 8-hour workdays

export const POST = async (req) => {
  const body = await req.json();
  const { prompt, currentFields, correction, team, duration } = body;
  const totalDevs = team?.developers + team?.designers || 0;
  const totalHours = duration?.hours || (duration?.days * 8) || 0;

  try {
    const previousProjects = await getPreviousProjects();

    // Calculate average hours per developer from previous projects
    const projectsWithHourPerDev = previousProjects
      .filter((project) => {
        const teamSize =
          (project.team?.frontend || 0) +
          (project.team?.backend || 0) +
          (project.team?.designers || 0);
        return teamSize > 0; // Filter out projects with no team data
      })
      .map((project) => {
        const teamSize =
          (project.team?.frontend || 0) +
          (project.team?.backend || 0) +
          (project.team?.designers || 0);

        const totalProjectHours =
          project.modules?.reduce(
            (total, module) =>
              total +
              (module.submodules?.reduce(
                (subTotal, sub) => subTotal + (sub.time || 0),
                0
              ) || 0),
            0
          ) || 0;

        return totalProjectHours / teamSize; // hours per developer
      });

    const avgHourPerDev =
      projectsWithHourPerDev.length > 0
        ? projectsWithHourPerDev.reduce((sum, hours) => sum + hours, 0) /
          projectsWithHourPerDev.length
        : 0;

    const projectReferences = previousProjects
      .filter(
        (project) =>
          project && project.modules && Array.isArray(project.modules)
      )
      .map((project) => {
        const projectTeamSize =
          (project.team?.frontend || 0) +
          (project.team?.backend || 0) +
          (project.team?.designers || 0);

        const projectTotalHours = project.modules.reduce(
          (total, module) =>
            total +
            (module.submodules?.reduce(
              (subTotal, sub) => subTotal + (sub.time || 0),
              0
            ) || 0),
          0
        );

        return {
          title: project.title || "Untitled Project",
          totalHours: projectTotalHours,
          teamSize: projectTeamSize,
          hourPerDev: projectTotalHours / projectTeamSize,
          modules: project.modules.map((module) => ({
            name: module?.name || "Unnamed Module",
            category: module?.category || "uncategorized",
            complexity: module?.complexity || "medium",
            percentageOfTotal:
              (module.submodules?.reduce(
                (total, sub) => total + (sub.time || 0),
                0
              ) /
                projectTotalHours) *
                100 || 0,
            submodules: Array.isArray(module?.submodules)
              ? module.submodules.map((sub) => ({
                  name: sub?.name || "Unnamed Submodule",
                  category: sub?.category || "uncategorized",
                  time: sub?.time || 0,
                  adjustedTime: calculateAdjustedTime(
                    sub.time || 0,
                    projectTeamSize,
                    totalDevs
                  ),
                  project_title: project.title,
                  original_team_size: projectTeamSize,
                }))
              : [],
          })),
        };
      });

    // Add this code to calculate average category distribution
    const categoryTotals = {};
    let totalTime = 0;

    projectReferences.forEach((project) => {
      project.modules.forEach((module) => {
        const categoryTime = module.submodules.reduce(
          (total, sub) => total + sub.time,
          0
        );
        categoryTotals[module.category] =
          (categoryTotals[module.category] || 0) + categoryTime;
        totalTime += categoryTime;
      });
    });

    const avgCategoryDistribution = Object.entries(categoryTotals).reduce(
      (acc, [category, time]) => {
        acc[category] =
          totalTime > 0 ? ((time / totalTime) * 100).toFixed(2) : 0;
        return acc;
      },
      {}
    );

    // Adjust similar references to account for team size
    const flattenedReferences = projectReferences.flatMap((project) =>
      project.modules.flatMap((module) =>
        module.submodules.map((sub) => ({
          project_name: project.title,
          module_name: module.name,
          submodule_name: sub.name,
          category: sub.category,
          original_time: sub.time,
          adjusted_time: sub.adjustedTime,
          original_team_size: sub.original_team_size,
        }))
      )
    );

    const systemPrompt = correction
      ? `You are a project estimation expert. Review and modify the existing estimate based on the correction request.
         Current estimate: ${JSON.stringify(currentFields)}
         Correction request: ${correction}
         
         Team size: ${totalDevs} developers
         Total project hours: ${totalHours}
         Average hours per developer from similar projects: ${avgHourPerDev.toFixed(
           2
         )}
         
         Previous project references and time distributions:
         ${JSON.stringify({ projectReferences, avgCategoryDistribution })}
         
         Important: When suggesting similar references, use the adjusted_time values which have been scaled for your team size.
         The original estimates were made with different team sizes, and the adjusted times account for these differences.
         
         Modify the estimate while maintaining this JSON schema:
         {
           "title": "string",
           "description": "string",
           "modules": [
             {
               "name": "string",
               "category": "string (e.g., 'authentication', 'data-management', 'ui-components', 'integration', 'infrastructure')",
               "complexity": "string (low|medium|high)",
               "reusability": "number (0-100 percentage)",
               "submodules": [
                 {
                   "name": "string",
                   "category": "string",
                   "time": "number (hours)",
                   "description": "string",
                   "similar_references": [
                     {
                       "project_name": "string",
                       "module_name": "string",
                       "time_taken": "number (hours)"
                     }
                   ]
                 }
               ]
             }
           ]
         }`
      : `You are a project estimation expert. Convert project descriptions into structured estimates with modules and timelines.
         
         Team size: ${totalDevs} developers
         Total project hours: ${totalHours}
         Average hours per developer from similar projects: ${avgHourPerDev.toFixed(
           2
         )}
         
         Previous project references and time distributions:
         ${JSON.stringify({ projectReferences, avgCategoryDistribution })}
         
         Distribute the total hours (${totalHours}) across modules based on these category percentages: ${JSON.stringify(
          avgCategoryDistribution
        )}
         When creating modules, match them with similar previous project modules and include time references.
         
         Always respond with valid JSON matching this schema:
         {
           "title": "string",
           "description": "string",
           "duration": "number (days)",
           "team": {
             "developers": "number",
             "designers": "number"
           },
           "budget": {
             "total": "number",
             "breakdown": {
               "development": "number",
               "testing": "number",
               "deployment": "number"
             }
           },
           "modules": [
             {
               "name": "string",
               "category": "string (e.g., 'authentication', 'data-management', 'ui-components', 'integration', 'infrastructure')",
               "complexity": "string (low|medium|high)",
               "reusability": "number (0-100 percentage)",
               "submodules": [
                 {
                   "name": "string",
                   "category": "string",
                   "time": "number (hours)",
                   "description": "string",
                   "similar_references": [
                     {
                       "project_name": "string",
                       "module_name": "string",
                       "time_taken": "number (hours)"
                     }
                   ]
                 }
               ]
             }
           ]
         }`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: correction
            ? "Please update the estimate based on the correction request."
            : `Convert this project pitch into a detailed project estimate: ${prompt}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const projectEstimate = JSON.parse(response.choices[0].message.content);

    // Add team and duration data before saving
    const enrichedProjectData = {
      ...projectEstimate,
      team: {
        developers: team?.developers || 0,
        designers: team?.designers || 0
      },
      duration: {
        hours: totalHours,
        hoursPerDev: totalDevs > 0 ? totalHours / totalDevs : 0
      }
    };

    // Save to Firebase with the enriched data
    const projectId = await saveProjectEstimate(enrichedProjectData);

    // Before returning, validate and adjust time estimates
    if (projectEstimate.modules) {
      const totalProjectHours = duration?.hours || (duration?.days * 8) || 0;
      
      projectEstimate.modules.forEach((module) => {
        if (module.submodules) {
          module.submodules.forEach((sub) => {
            // Validate and adjust each submodule's time
            sub.time = validateTimeEstimate(sub, flattenedReferences, totalProjectHours);
            
            // Update similar references with adjusted times
            if (sub.similar_references) {
              sub.similar_references.forEach(ref => {
                const originalRef = flattenedReferences.find(r => 
                  r.project_name === ref.project_name && 
                  r.module_name === ref.module_name
                );
                if (originalRef) {
                  ref.time_taken = originalRef.adjusted_time;
                }
              });
            }
          });
        }
      });

      // Final validation to ensure total hours match
      const estimatedHours = projectEstimate.modules.reduce(
        (total, module) =>
          total +
          module.submodules.reduce((subTotal, sub) => subTotal + sub.time, 0),
        0
      );

      if (Math.abs(estimatedHours - totalProjectHours) > totalProjectHours * 0.1) {
        const scaleFactor = totalProjectHours / estimatedHours;
        projectEstimate.modules.forEach((module) => {
          module.submodules.forEach((sub) => {
            sub.time = Math.round(sub.time * scaleFactor);
          });
        });
      }
    }

    return new NextResponse(JSON.stringify(enrichedProjectData), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to process request" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

const validateTimeEstimate = (estimate, similarReferences, totalProjectHours) => {
  if (!estimate.time) return 0;
  
  const weightedAverage = calculateWeightedAverageTime(similarReferences, estimate.category);
  if (!weightedAverage) return estimate.time;

  const maxDeviation = 0.5; // 50% deviation allowed
  const minTime = weightedAverage * (1 - maxDeviation);
  const maxTime = weightedAverage * (1 + maxDeviation);

  // If the estimate is outside the acceptable range, bring it within bounds
  if (estimate.time < minTime) return Math.round(minTime);
  if (estimate.time > maxTime) return Math.round(maxTime);

  // Ensure no single task takes more than 30% of total project time
  const maxTaskTime = totalProjectHours * 0.3;
  if (estimate.time > maxTaskTime) return Math.round(maxTaskTime);

  return Math.round(estimate.time);
};
