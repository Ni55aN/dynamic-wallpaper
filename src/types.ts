export interface Category {
  id: string;
  text: string;
}

export interface CategoryDetails {
  pagesCount: number
}

export interface Source {
  downloadImage(id: string): Promise<Buffer>;
  getCategories(): Promise<Category[]>;
  getImages(category: Category, page: number): Promise<string[]>;
  getCategoryDetails(category: Category): Promise<CategoryDetails>;
}