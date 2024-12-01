"use client";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Check, Eye, IndianRupee, Trash2 } from "lucide-react";
import { addDoc, collection } from "firebase/firestore";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { FaFilePdf } from "react-icons/fa";
import { MdEdit } from "react-icons/md";
import { X } from "lucide-react";
import axios from "axios";
import { db } from "@/firebase";
import { useRouter } from "next/navigation";

export default function AddProject() {
  const [description, setDescription] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  const [budget, setBudget] = useState("");
  const [duration, setDuration] = useState("");
  const [hasDescription, setHasDescription] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [projectName, setProjectName] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const router = useRouter();

  const handleSubmit = () => {
    setHasDescription(true);
    setIsOpen(false);
  };
  const handleDelete = () => {
    setDescription("");
    setHasDescription(false);
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
      handlePdfExtract(e.target.files[0]);
    }
  };
  const handlePdfExtract = async (pdfFile: File) => {
    try {
      setLoading(true);
      setShowProgress(true);
      setProgress(0);
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);
      const formData = new FormData();
      formData.append("pdfFile", pdfFile);
      const response = await axios.post(
        "http://localhost:8082/extract-text",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      clearInterval(progressInterval);
      setProgress(100);
      setTimeout(() => {
        setDescription(response.data);
        setIsOpen(true);
        setShowProgress(false);
      }, 500);
    } catch (error) {
      console.error("Error:", error);
      alert("Error extracting text from PDF");
    } finally {
      setLoading(false);
    }
  };
  const handleGenerate = async () => {
    try {
      setIsGenerating(true);

      const projectData = {
        name: projectName,
        description: description,
        budget: Number(budget),
        duration: Number(duration),
        createdAt: new Date(),
      };

      const docRef = await addDoc(collection(db, "projects"), projectData);

      router.push(`/generate/${docRef.id}`);
    } catch (error) {
      console.error("Error generating project:", error);
      alert("Error generating project");
    } finally {
      setIsGenerating(false);
    }
  };
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Project Name Input */}
      <div className="mb-4">
        <input
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          placeholder="Enter Project Name"
          className="w-full px-4 py-2 text-lg border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Description Section with View/Delete */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-semibold">Add Description</h2>
          {hasDescription && <Check className="h-5 w-5 text-green-500" />}
        </div>
        {hasDescription && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(true)}
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              View
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              className="flex items-center gap-2 text-red-500 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        )}
      </div>
      {/* Input Type Options */}
      <div className="flex gap-4 justify-between mb-6">
        {/* PDF Option */}
        <div className="flex-1 cursor-pointer relative">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="absolute inset-0 opacity-0 cursor-pointer"
            disabled={hasDescription}
          />
          <div
            className={`border rounded-lg p-6 hover:shadow-lg transition-shadow text-center
            ${
              hasDescription
                ? "opacity-50 cursor-not-allowed"
                : "hover:border-blue-500"
            }`}
          >
            <FaFilePdf className="mx-auto text-4xl text-red-500 mb-2" />
            <h3 className="font-medium">{loading ? "Processing..." : "PDF"}</h3>
          </div>
        </div>
        {/* Write Option with Alert Dialog */}
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
          <AlertDialogTrigger asChild>
            <div className="flex-1 cursor-pointer">
              <div
                className={`border rounded-lg p-6 hover:shadow-lg transition-shadow text-center
                ${
                  hasDescription
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:border-blue-500"
                }`}
              >
                <MdEdit className="mx-auto text-4xl text-blue-500 mb-2" />
                <h3 className="font-medium">Write</h3>
              </div>
            </div>
          </AlertDialogTrigger>
          <AlertDialogContent className="w-[50vw] h-[50vh] flex flex-col">
            <div className="flex justify-end items-center mb-4">
              <AlertDialogTitle className="sr-only">
                Project Description Input
              </AlertDialogTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-md hover:bg-gray-100"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="flex-1 p-4 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your description here..."
              readOnly={viewMode}
            />
            <div className="flex justify-end mt-4">
              {!viewMode && <Button onClick={handleSubmit}>Submit</Button>}
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      {/* Progress Bar */}
      {showProgress && (
        <div className="mb-8">
          <div className="max-w-xl mx-auto">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-blue-500">
                Processing PDF
              </span>
              <span className="text-sm font-medium text-blue-500">
                {progress}%
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-300 ease-out"
                style={{
                  width: `${progress}%`,
                  boxShadow: "0 0 10px rgba(59, 130, 246, 0.5)",
                }}
              />
            </div>
          </div>
        </div>
      )}
      {/* Budget and Duration Section */}
      <div className="mt-8 space-y-6">
        {/* Budget Input */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Estimated Budget
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <IndianRupee className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="pl-10 w-full px-4 py-2 text-lg border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter budget amount"
            />
          </div>
        </div>
        {/* Duration Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Project Duration (days)
          </label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-full px-4 py-2 text-lg border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter duration in days"
          />
        </div>
      </div>
      {/* After Duration Input, add Generate Button */}
      <div className="mt-8">
        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full"
        >
          {isGenerating ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Generating...
            </div>
          ) : (
            "Generate Project"
          )}
        </Button>
      </div>
    </div>
  );
}
