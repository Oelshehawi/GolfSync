export type ThemeConfig = {
  primary?: string;
  secondary?: string;
  tertiary?: string;
};

export type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};
