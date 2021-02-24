export interface HashableObject {
  getHashCode: (obj : any) => string
}
export interface CustomStorageObject { 
  [ index: string ]: any 
}