"use client";

import { ChevronLeft, ChevronRight, Edit, Eye, MoreVertical, Trash2 } from "lucide-react";
import { collection, deleteDoc, doc, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";

import { db } from "@/firebase";
import { useRouter } from "next/navigation";

interface Project {
  id: string;
  name: string;
  description: string;
  budget: number;
  duration: number;
  createdAt: Date;
}

interface DeleteModalProps {
  isOpen: boolean;
  projectName: string;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

const DeleteConfirmationModal = ({ isOpen, projectName, onClose, onConfirm, isDeleting }: DeleteModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative transform overflow-hidden rounded-2xl bg-white px-6 py-6 shadow-xl transition-all w-full max-w-lg">
          <div className="flex flex-col items-center">
            {/* Warning Icon */}
            <div className="mx-auto flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-red-100 mb-4">
              <Trash2 className="h-8 w-8 text-red-600" />
            </div>
            
            {/* Title */}
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Delete Project
            </h3>
            
            {/* Message */}
            <p className="text-center text-gray-600 mb-6">
              Are you sure you want to delete <span className="font-semibold text-gray-900">"{projectName}"</span>? 
              This action cannot be undone.
            </p>
            
            {/* Buttons */}
            <div className="flex space-x-4 w-full">
              <button
                type="button"
                onClick={onClose}
                disabled={isDeleting}
                className="flex-1 rounded-xl bg-white px-4 py-3 text-base font-semibold text-gray-700 border border-gray-300 
                  hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isDeleting}
                className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-base font-semibold text-white 
                  hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Deleting...
                  </div>
                ) : (
                  'Delete Project'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function ProjectTable() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const projectsPerPage = 10;
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const projectsRef = collection(db, "projects");
        const snapshot = await getDocs(projectsRef);
        const projectsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
        })) as Project[];
        setProjects(projectsData);
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Calculate pagination
  const indexOfLastProject = currentPage * projectsPerPage;
  const indexOfFirstProject = indexOfLastProject - projectsPerPage;
  const currentProjects = projects.slice(indexOfFirstProject, indexOfLastProject);
  const totalPages = Math.ceil(projects.length / projectsPerPage);

  const handleDelete = async () => {
    if (!projectToDelete) return;
    
    try {
      setIsDeleting(true);
      const projectRef = doc(db, "projects", projectToDelete.id);
      await deleteDoc(projectRef);
      
      setProjects(prevProjects => 
        prevProjects.filter(project => project.id !== projectToDelete.id)
      );
      
      setDeleteModalOpen(false);
      setProjectToDelete(null);
    } catch (error) {
      console.error("Error deleting project:", error);
      alert("Failed to delete project. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-xl rounded-xl overflow-hidden border m-10 border-gray-100">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gradient-to-r from-blue-900 to-blue-900">
          <tr>
            <th className="px-6 py-5 text-left text-base font-extrabold text-white uppercase tracking-wider">S.No</th>
            <th className="px-6 py-5 text-left text-base font-extrabold text-white uppercase tracking-wider">Project Name</th>
            <th className="px-6 py-5 text-left text-base font-extrabold text-white uppercase tracking-wider">Budget</th>
            <th className="px-6 py-5 text-left text-base font-extrabold text-white uppercase tracking-wider">Duration</th>
            <th className="px-6 py-5 text-left text-base font-extrabold text-white uppercase tracking-wider">Created At</th>
            <th className="px-6 py-5 text-left text-base font-extrabold text-white uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {currentProjects.map((project, index) => (
            <tr
              key={project.id}
              className={`hover:bg-blue-50 transition-colors duration-150 ease-in-out
                ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
            >
              <td className="px-6 py-5 whitespace-nowrap">
                <div className="text-lg font-extrabold text-gray-900">
                  {indexOfFirstProject + index + 1}
                </div>
              </td>
              <td className="px-6 py-5 whitespace-nowrap">
                <div className="text-lg font-bold text-gray-900">{project.name}</div>
              </td>
              <td className="px-6 py-5 whitespace-nowrap">
                <div className="text-lg font-bold text-blue-700">
                  ₹{project.budget.toLocaleString()}
                </div>
              </td>
              <td className="px-6 py-5 whitespace-nowrap">
                <div className="text-lg font-bold text-gray-900">
                  {project.duration} days
                </div>
              </td>
              <td className="px-6 py-5 whitespace-nowrap">
                <div className="text-base font-semibold text-gray-700">
                  {project.createdAt.toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </div>
              </td>
              <td className="px-6 py-5 whitespace-nowrap">
                <div className="relative">
                  <button 
                    onClick={() => setOpenDropdownId(openDropdownId === project.id ? null : project.id)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-150"
                  >
                    <MoreVertical className="w-5 h-5 text-gray-600" />
                  </button>
                  
                  {openDropdownId === project.id && (
                    <>
                      <div 
                        className="fixed inset-0 z-10"
                        onClick={() => setOpenDropdownId(null)}
                      />
                      <div className="absolute right-0 mt-2 w-48 rounded-xl shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
                        <div className="py-1">
                          <button
                            onClick={() => {
                              router.push(`/details/${project.id}`);
                              setOpenDropdownId(null);
                            }}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors duration-150"
                          >
                            <Eye className="w-4 h-4 mr-3" />
                            View Details
                          </button>
                          <button
                            onClick={() => {
                              router.push(`/generate/${project.id}`);
                              setOpenDropdownId(null);
                            }}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors duration-150"
                          >
                            <Edit className="w-4 h-4 mr-3" />
                            Edit Project
                          </button>
                          <button
                            onClick={() => {
                              setProjectToDelete(project);
                              setDeleteModalOpen(true);
                              setOpenDropdownId(null);
                            }}
                            className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150"
                          >
                            <Trash2 className="w-4 h-4 mr-3" />
                            Delete Project
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination Controls */}
      <div className="bg-gray-50 px-8 py-5 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="text-base font-semibold text-gray-700">
            Showing {indexOfFirstProject + 1} to {Math.min(indexOfLastProject, projects.length)} of {projects.length} projects
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setCurrentPage(prev => prev - 1)}
              disabled={currentPage === 1}
              className={`p-2.5 rounded-lg ${
                currentPage === 1
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-blue-600 hover:bg-blue-50'
              }`}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <span className="px-5 py-2 rounded-lg text-base font-bold bg-blue-600 text-white">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={currentPage === totalPages}
              className={`p-2.5 rounded-lg ${
                currentPage === totalPages
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-blue-600 hover:bg-blue-50'
              }`}
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        projectName={projectToDelete?.name || ''}
        onClose={() => {
          setDeleteModalOpen(false);
          setProjectToDelete(null);
        }}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}