declare global {
    namespace NodeJS {
      interface ProcessEnv {
        FOLDER_PATH: string;
      }
    }
  }
  
export {};