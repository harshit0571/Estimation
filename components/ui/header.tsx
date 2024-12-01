"use client";

import { PlusCircle } from "lucide-react";
import { useRouter } from "next/navigation";
export default function Header() {
  const router = useRouter();
  return (
    <header className="bg-gradient-to-r from-blue-900 to-blue-900 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-white p-2 rounded-lg shadow-md">
              <svg
                className="w-8 h-8 text-blue-900"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">
              ProjectEstimate
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <button
              className="inline-flex items-center px-4 py-2 bg-white text-blue-900
              rounded-lg shadow-md hover:bg-blue-50 transition-all duration-200
              font-medium text-sm gap-2 hover:shadow-lg"
              onClick={() => router.push("/add-project")}
            >
              <PlusCircle className="w-5 h-5" />
              Add Project
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
