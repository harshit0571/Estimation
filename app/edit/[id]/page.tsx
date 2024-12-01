"use client";

import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Clock,
  Plus,
  X,
} from "lucide-react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { db } from "@/firebase";

interface Project {
  id: string;
  name: string;
  description: string;
  budget: number;
  duration: number;
  createdAt: Date;
  generatedData?: any[];
}

interface SubModule {
  title: string;
  exists: boolean;
  moduleName: string;
  duration: number;
}

interface ModuleGroup {
  [key: string]: SubModule[];
}

export default function EditProject() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    budget: 0,
    duration: 0,
  });
  const [moduleGroups, setModuleGroups] = useState<ModuleGroup>({});
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [moduleNames, setModuleNames] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchProject = async () => {
      try {
        if (!params.id) return;
        const projectRef = doc(db, "projects", params.id as string);
        const projectSnap = await getDoc(projectRef);

        if (projectSnap.exists()) {
          const data = projectSnap.data() as Project;
          setProject({ ...data, id: projectSnap.id });
          setFormData({
            name: data.name,
            description: data.description,
            budget: data.budget,
            duration: data.duration,
          });

          const groups = Array.isArray(data.generatedData)
            ? data.generatedData.reduce((acc, item) => {
                if (!acc[item.moduleName]) {
                  acc[item.moduleName] = [];
                }
                acc[item.moduleName].push(item);
                return acc;
              }, {} as ModuleGroup)
            : {};

          setModuleGroups(groups);

          const initialModuleNames = Object.keys(groups).reduce(
            (acc, moduleName) => {
              acc[moduleName] = moduleName;
              return acc;
            },
            {} as Record<string, string>
          );
          setModuleNames(initialModuleNames);
        }
      } catch (error) {
        console.error("Error fetching project:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;

    try {
      setSaving(true);
      const projectRef = doc(db, "projects", project.id);

      const generatedData = Object.values(moduleGroups).flat();

      await updateDoc(projectRef, {
        ...formData,
        budget: Number(formData.budget),
        duration: Number(formData.duration),
        generatedData,
      });

      router.push(`/details/${project.id}`);
    } catch (error) {
      console.error("Error updating project:", error);
      alert("Failed to update project. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const updateSubModule = (
    moduleName: string,
    index: number,
    updates: Partial<SubModule>
  ) => {
    setModuleGroups((prev) => {
      const newGroups = { ...prev };
      newGroups[moduleName][index] = {
        ...newGroups[moduleName][index],
        ...updates,
      };
      return newGroups;
    });
  };

  const updateModuleName = (oldName: string, newName: string) => {
    setModuleGroups((prev) => {
      const newGroups = { ...prev };
      // If new name already exists, merge the submodules
      if (newName in newGroups) {
        newGroups[newName] = [...newGroups[newName], ...newGroups[oldName]];
      } else {
        // Create new entry with new name
        newGroups[newName] = newGroups[oldName];
      }
      // Update moduleName in all submodules
      newGroups[newName] = newGroups[newName].map((subModule) => ({
        ...subModule,
        moduleName: newName,
      }));
      // Delete old entry
      delete newGroups[oldName];
      return newGroups;
    });
  };

  const handleModuleNameChange = (oldName: string, newValue: string) => {
    setModuleNames((prev) => ({
      ...prev,
      [oldName]: newValue,
    }));
  };

  const handleModuleNameBlur = (oldName: string) => {
    const newName = moduleNames[oldName]?.trim();
    if (newName && newName !== oldName) {
      updateModuleName(oldName, newName);
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
    return <div>Project not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => router.back()}
            className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Edit Project</h1>
        </div>

        {/* Edit Form */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <form className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Budget (₹)
                </label>
                <input
                  type="number"
                  value={formData.budget}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      budget: Number(e.target.value),
                    }))
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (days)
                </label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      duration: Number(e.target.value),
                    }))
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  min="1"
                />
              </div>
            </div>
          </form>
        </div>

        {/* Generated Modules Section */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Generated Modules
          </h2>

          {Object.entries(moduleGroups).map(([moduleName, subModules]) => (
            <div key={moduleName} className="mb-6">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between gap-4">
                  {/* Module Name Edit Section */}
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Module Name
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        value={moduleNames[moduleName] || ""}
                        onChange={(e) =>
                          handleModuleNameChange(moduleName, e.target.value)
                        }
                        onBlur={() => handleModuleNameBlur(moduleName)}
                        className="flex-1 px-4 py-2 rounded-lg border border-gray-300 
                          focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                          text-lg font-bold text-gray-900"
                      />
                      <button
                        onClick={() =>
                          setExpandedModule(
                            expandedModule === moduleName ? null : moduleName
                          )
                        }
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        {expandedModule === moduleName ? (
                          <ChevronUp className="w-6 h-6 text-gray-600" />
                        ) : (
                          <ChevronDown className="w-6 h-6 text-gray-600" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Module Summary */}
                  <div className="flex items-center gap-4 px-4 py-2 bg-white rounded-lg border border-gray-200">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">{subModules.length}</span>{" "}
                      submodules
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">
                        {subModules.reduce(
                          (acc, sub) => acc + (sub.duration || 0),
                          0
                        )}
                      </span>{" "}
                      hours total
                    </div>
                  </div>
                </div>

                {/* Submodules Section */}
                {expandedModule === moduleName && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {subModules.map((subModule, index) => (
                      <div
                        key={index}
                        className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
                      >
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Submodule Title
                            </label>
                            <input
                              type="text"
                              value={subModule.title}
                              onChange={(e) =>
                                updateSubModule(moduleName, index, {
                                  title: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 rounded-lg border border-gray-300 
                                focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Duration (hours)
                            </label>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <input
                                type="number"
                                value={subModule.duration}
                                onChange={(e) =>
                                  updateSubModule(moduleName, index, {
                                    duration: Math.max(
                                      0,
                                      Number(e.target.value)
                                    ),
                                  })
                                }
                                className="flex-1 px-3 py-2 rounded-lg border border-gray-300 
                                  focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                                  [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                min="0"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Save Button Section */}
        <div className="mt-6 flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 rounded-xl text-gray-700 bg-gray-100 hover:bg-gray-200 font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <div className="flex items-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Saving...
              </div>
            ) : (
              "Save All Changes"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
