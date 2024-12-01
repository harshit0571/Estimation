"use client";

import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  Clock,
  DollarSign,
} from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { db } from "@/firebase";

interface GeneratedDataItem {
  duration: string;
  moduleName: string;
  title: string;
}

interface Project {
  id: string;
  name: string;
  // description: string;
  budget: number;
  duration: number;
  createdAt: Date;
  generatedData?: GeneratedDataItem[];
}

export default function ProjectDetails() {
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({});
  const params = useParams();

  useEffect(() => {
    const fetchProject = async () => {
      try {
        if (!params.id || Array.isArray(params.id)) {
          throw new Error("Invalid project ID");
        }
        const projectRef = doc(db, "projects", params.id);
        const projectSnap = await getDoc(projectRef);

        if (projectSnap.exists()) {
          const data = projectSnap.data();
          setProject({
            id: projectSnap.id,
            name: data.name,
            // description: data.description,
            budget: data.budget,
            duration: data.duration,
            createdAt: data.createdAt.toDate(),
            generatedData: Array.isArray(data.generatedData?.suggestions)
              ? data.generatedData.suggestions.filter((item: any) => item.title)
              : [],
          });
        }
      } catch (error: unknown) {
        console.error("Error fetching project:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [params.id]);
  console.log(project);

  const toggleModule = (moduleName: string) => {
    setOpenModules((prev) => ({
      ...prev,
      [moduleName]: !prev[moduleName],
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Project not found
          </h1>
          <button
            onClick={() => router.push("/")}
            className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" /> Go back to projects
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => router.push("/")}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-800 font-semibold"
        >
          <ArrowLeft className="w-5 h-5" /> Back to Projects
        </button>

        {/* Project Header */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-6">
            {project.name.slice(0, 1).toUpperCase() + project.name.slice(1)}
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 rounded-xl p-6 flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <DollarSign className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600">Budget</p>
                <p className="text-2xl font-bold text-blue-600">
                  ₹{project.budget.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="bg-green-50 rounded-xl p-6 flex items-center gap-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <Clock className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600">Duration</p>
                <p className="text-2xl font-bold text-green-600">
                  {project.duration} days
                </p>
              </div>
            </div>

            <div className="bg-purple-50 rounded-xl p-6 flex items-center gap-4">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Calendar className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600">
                  Created On
                </p>
                <p className="text-2xl font-bold text-purple-600">
                  {project.createdAt.toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Generated Data Section */}
        {project.generatedData && project.generatedData.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">
              Generated Modules
            </h2>

            {Object.entries(
              project.generatedData.reduce((acc, item) => {
                if (!acc[item.moduleName]) {
                  acc[item.moduleName] = [];
                }
                acc[item.moduleName].push(item);
                return acc;
              }, {} as Record<string, typeof project.generatedData>)
            ).map(([moduleName, items], moduleIndex) => (
              <div key={moduleName} className="mb-6">
                <button
                  onClick={() => toggleModule(moduleName)}
                  className="w-full bg-gray-50 rounded-xl p-4 border border-gray-200 hover:bg-gray-100 transition-colors duration-200"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold">
                        {moduleIndex + 1}
                      </div>
                      {moduleName}
                    </h3>
                    <div
                      className={`transform transition-transform duration-200 ${
                        openModules[moduleName] ? "rotate-180" : ""
                      }`}
                    >
                      <ChevronDown className="w-6 h-6 text-gray-600" />
                    </div>
                  </div>
                </button>

                <div
                  className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 bg-white rounded-b-xl border-x border-b border-gray-200
                  transition-all duration-200 ease-in-out origin-top
                  ${
                    openModules[moduleName]
                      ? "scale-y-100 opacity-100 h-auto"
                      : "scale-y-0 opacity-0 h-0 overflow-hidden"
                  }`}
                >
                  {items.map((item, index) => (
                    <div
                      key={index}
                      className="group relative bg-white rounded-2xl p-6 transition-all duration-300
                        hover:shadow-[0_0_30px_rgba(0,0,0,0.12)] 
                        border border-gray-100 hover:border-blue-500/30"
                    >
                      <div className="relative flex flex-col h-full">
                        {/* Status Badge */}
                        <div className="flex justify-between items-start mb-5">
                          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm">
                            <Clock className="w-3.5 h-3.5 mr-1" />
                            {item.duration} hrs
                          </span>
                        </div>

                        {/* Title */}
                        <h4 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                          {item.title}
                        </h4>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
