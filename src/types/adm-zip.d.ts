declare module 'adm-zip' {
  interface IZipEntry {
    entryName: string;
    comment: string;
    name: string;
    isDirectory: boolean;
    header: any;
    data: Buffer;
    getData(): Buffer;
    getDataAsString(encoding?: string): string;
  }

  interface IZipOptions {
    noSort?: boolean;
    readEntries?: boolean;
  }

  class AdmZip {
    constructor(inputFilePath?: string | Buffer, options?: IZipOptions);
    
    addFile(entryPath: string, content: Buffer | string, comment?: string, attr?: number): void;
    addFileComment(entryPath: string, comment: string): void;
    addLocalFile(localPath: string, zipPath?: string): void;
    addLocalFolder(localPath: string, zipPath?: string, filter?: (filename: string) => boolean): void;
    
    deleteFile(entryPath: string): boolean;
    getEntry(entryPath: string): IZipEntry | null;
    getEntries(): IZipEntry[];
    
    extractAllTo(targetPath: string, overwrite?: boolean): void;
    extractEntryTo(entryPath: string, targetPath: string, maintainEntryPath?: boolean, overwrite?: boolean): boolean;
    
    writeZip(targetPath: string, callback?: (error: Error | null) => void): void;
    toBuffer(): Buffer;
    
    readFile(entryPath: string): Buffer | null;
    readAsText(entryPath: string, encoding?: string): string | null;
  }

  export default AdmZip;
}

