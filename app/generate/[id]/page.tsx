"use client";

import { addDoc, collection, doc, getDoc, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import ProjectChat from "@/app/components/ProjectChat";
import axios from "axios";
import { db } from "@/firebase";

interface Project {
  name: string;
  description: string;
  budget: number;
  duration: number;
  createdAt: Date;
  generatedData?: any;
}

export default function GeneratePage() {
  const { id } = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const projectRef = doc(db, "projects", id as string);
        const projectSnap = await getDoc(projectRef);

        if (projectSnap.exists()) {
          const projectData = projectSnap.data() as Project;
          setProject(projectData);
          if (projectData.generatedData) {
            setFinal(projectData.generatedData);
          }
        }
      } catch (error) {
        console.error("Error fetching project:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [id]);

  const [result, setResult] = useState<any>(null);
  const [final, setFinal] = useState<any>(null);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post("/api/refactor-text", {
        input: project?.description,
        duration: Number(project?.duration) || 0,
      });
      setResult(response.data);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleGenerate = async () => {
    try {
      const response = await axios.post("/api/generate", {
        data: result.modules,
        duration: Number(project?.duration) || 0,
      });
      console.log("Generated response:", response.data);
      setFinal(response.data);
    } catch (error) {
      console.error("Error generating:", error);
    }
  };

  useEffect(() => {
    if (result !== null) {
      handleGenerate();
    }
  }, [result]);

  const handleUpdateSuggestions = (newSuggestions: any) => {
    setFinal(newSuggestions);
    // setResult({ modules: newSuggestions });
  };

  const handleDone = async () => {
    try {
      if (!final || !id) return;

      // Update project document with generated data
      const projectRef = doc(db, "projects", id as string);
      await updateDoc(projectRef, {
        generatedData: final,
      });

      // Save submodules to collection
      const submodulesRef = collection(db, "submodules");
      for (const module of final.suggestions) {
        // Create a unique ID for the submodule based on its name

        if (!module.exists) {
          await addDoc(submodulesRef, {
            name: module.title,
            moduleName: module.moduleName,
            duration: module.duration,
            processTitle: module.title.trim().toLowerCase().replace(/\s+/g, ""),
            createdAt: new Date(),
          });
        }
      }
      const submodulesCollectionRef = collection(db, "submodules");
      for (const module of final.suggestions) {
        console.log(module);
        if (module.exists === false) {
          await addDoc(submodulesCollectionRef, {
            name: module.title,
            moduleName: module.moduleName,
            duration: module.duration,
            createdAt: new Date(),
          });
        }
      }

      alert("Successfully saved project data!");
    } catch (error) {
      console.error("Error saving project data:", error);
      alert("Error saving project data");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!project) {
    return <div className="text-center p-4">Project not found</div>;
  }

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">
        Generating Project:{" "}
        <span className="text-blue-600">{project.name}</span>
      </h1>

      <div className="flex gap-8">
        {/* Left Column - Generation Section */}
        <div className="flex-1 bg-white rounded-xl shadow-lg p-8 space-y-6 max-w-2xl">
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Project Description
            </h2>
            <textarea
              value={project.description}
              readOnly
              className="w-full px-4 py-3 text-base text-gray-700 border rounded-lg min-h-[160px] bg-gray-50 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
              <h2 className="text-lg font-bold text-gray-800 mb-2">Budget</h2>
              <p className="text-2xl font-bold text-blue-600">
                ${project.budget}
              </p>
            </div>
            <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
              <h2 className="text-lg font-bold text-gray-800 mb-2">Duration</h2>
              <p className="text-2xl font-bold text-blue-600">
                {project.duration} days
              </p>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            className="w-full bg-blue-600 text-white px-6 py-4 rounded-xl hover:bg-blue-700 
              transition-colors font-bold text-lg shadow-md hover:shadow-lg"
          >
            Generate Project Plan
          </button>

          {final && (
            <>
              <div className="mt-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  Generated Project Data:
                </h2>
                <pre
                  className="bg-gray-50 p-6 rounded-xl overflow-auto max-h-[400px] text-base 
                  border border-gray-200 font-medium text-gray-700 custom-scrollbar"
                >
                  {JSON.stringify(final, null, 2)}
                </pre>
              </div>

              <button
                onClick={handleDone}
                className="w-full bg-green-600 text-white px-6 py-4 rounded-xl hover:bg-green-700 
                  transition-colors font-bold text-lg shadow-md hover:shadow-lg"
              >
                Save Project Data
              </button>
            </>
          )}
        </div>

        {/* Right Column - Project Chat */}
        {final && (
          <div className="flex-1 bg-white rounded-xl shadow-lg">
            <ProjectChat
              projectId={id as string}
              suggestions={final}
              project={{
                name: project.name,
                description: project.description,
                duration: project.duration,
              }}
              onUpdateSuggestions={handleUpdateSuggestions}
            />
          </div>
        )}
      </div>
    </div>
  );
}
