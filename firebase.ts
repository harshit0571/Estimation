import {
  addDoc,
  collection,
  doc,
  getDocs,
  getFirestore,
  query,
  updateDoc,
  where,
} from "firebase/firestore";

import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyDpPw1zF0sVhk5K0W7Sjm8bSKOyjvFqRn8",
  authDomain: "estimation-b46d9.firebaseapp.com",
  projectId: "estimation-b46d9",
  storageBucket: "estimation-b46d9.firebasestorage.app",
  messagingSenderId: "663828177104",
  appId: "1:663828177104:web:d0a133f96071cabd587ed5",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export interface Submodule {
  id: string;
  name: string;
  time: number;
  description: string;
}

export interface Module {
  id: string;
  name: string;
  projectId: string;
  submodules: Submodule[];
}

export interface Project {
  id: string;
  title: string;
  description: string;
  team: {
    frontend: number;
    backend: number;
    designers: number;
  };
  duration: {
    hours: number;
    hoursPerDev: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export const saveProjectEstimate = async (projectData: any) => {
  try {
    // Ensure we have the correct team and duration data
    const projectDoc = {
      title: projectData.title,
      description: projectData.description,
      team: {
        frontend: projectData.team?.frontend || 0,
        backend: projectData.team?.backend || 0,
        designers: projectData.team?.designers || 0,
      },
      duration: {
        hours: projectData.duration?.hours || 0,
        hoursPerDev: projectData.duration?.hoursPerDev || 0,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Create the project document
    const projectRef = await addDoc(collection(db, "projects"), projectDoc);

    // Then create modules with reference to project
    const modulesPromises = projectData.modules.map(async (module: any) => {
      const moduleRef = await addDoc(collection(db, "modules"), {
        name: module.name,
        projectId: projectRef.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Create submodules with reference to module
      const submodulesPromises = module.submodules.map((submodule: any) =>
        addDoc(collection(db, "submodules"), {
          name: submodule.name,
          time: submodule.time,
          description: submodule.description,
          moduleId: moduleRef.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );

      await Promise.all(submodulesPromises);
      return moduleRef;
    });

    await Promise.all(modulesPromises);
    return projectRef.id;
  } catch (error) {
    console.error("Error saving to Firebase:", error);
    throw error;
  }
};

export async function getPreviousProjects() {
  try {
    const projectsRef = collection(db, "projects");
    const projectsSnapshot = await getDocs(projectsRef);
    const projects = [];

    for (const doc of projectsSnapshot.docs) {
      const projectData = doc.data();

      // Ensure team and duration data exists with defaults
      const projectWithDefaults = {
        ...projectData,
        team: {
          frontend: projectData.team?.frontend || 0,
          backend: projectData.team?.backend || 0,
          designers: projectData.team?.designers || 0,
        },
        duration: {
          hours: projectData.duration?.hours || 0,
          hoursPerDev: projectData.duration?.hoursPerDev || 0,
        },
      };

      // Fetch modules for this project
      const modulesRef = collection(db, "modules");
      const modulesSnapshot = await getDocs(
        query(modulesRef, where("projectId", "==", doc.id))
      );

      const modules = [];

      for (const moduleDoc of modulesSnapshot.docs) {
        const moduleData = moduleDoc.data();

        const submodulesRef = collection(db, "submodules");
        const submodulesSnapshot = await getDocs(
          query(submodulesRef, where("moduleId", "==", moduleDoc.id))
        );

        const submodules = submodulesSnapshot.docs.map((subDoc) => ({
          id: subDoc.id,
          ...subDoc.data(),
        }));

        modules.push({
          id: moduleDoc.id,
          ...moduleData,
          submodules,
        });
      }

      projects.push({
        id: doc.id,
        ...projectWithDefaults,
        modules,
      });
    }

    console.log("Projects with modules and team data:", projects);
    return projects;
  } catch (error) {
    console.error("Error fetching previous projects:", error);
    return [];
  }
}

export { db };
