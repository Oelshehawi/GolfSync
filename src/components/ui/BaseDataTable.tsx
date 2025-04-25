"use client";

import { ReactNode, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { SearchBar } from "~/components/ui/search-bar";
import { ThemeConfig, PaginationProps } from "~/app/types/UITypes";

export interface BaseDataItem {
  id: number;
  [key: string]: any;
}

export type ColumnDef<T extends BaseDataItem> = {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => ReactNode;
};

export type ActionDef<T extends BaseDataItem> = {
  label: string;
  icon: ReactNode;
  onClick: (item: T) => void;
  className?: string;
};

interface BaseDataTableProps<T extends BaseDataItem> {
  data: T[];
  columns: ColumnDef<T>[];
  actions?: ActionDef<T>[];
  showSearch?: boolean;
  onSearch?: (term: string) => void;
  searchPlaceholder?: string;
  emptyMessage?: string;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  filterFunction?: (item: T, searchTerm: string) => boolean;
  theme?: ThemeConfig;
}

export function BaseDataTable<T extends BaseDataItem>({
  data,
  columns,
  actions,
  showSearch = false,
  onSearch,
  searchPlaceholder = "Search...",
  emptyMessage = "No items found",
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  filterFunction,
  theme,
}: BaseDataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredData =
    filterFunction && searchTerm
      ? data.filter((item) => filterFunction(item, searchTerm))
      : data;

  const handlePageChange = (page: number) => {
    if (onPageChange) {
      onPageChange(page);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  const renderPagination = () => {
    if (!onPageChange || totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        <span className="text-sm">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {showSearch && (
        <div className="flex items-center justify-between">
          <div className="w-1/3">
            <SearchBar
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder={searchPlaceholder}
              theme={theme || {}}
            />
          </div>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column, index) => (
                <TableHead key={index}>{column.header}</TableHead>
              ))}
              {actions && actions.length > 0 && (
                <TableHead className="w-[80px]">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={
                    columns.length + (actions && actions.length > 0 ? 1 : 0)
                  }
                  className="h-24 text-center"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((item) => (
                <TableRow key={item.id}>
                  {columns.map((column, index) => (
                    <TableCell key={index}>
                      {column.cell
                        ? column.cell(item)
                        : column.accessorKey
                          ? (item[column.accessorKey] ?? "-")
                          : "-"}
                    </TableCell>
                  ))}
                  {actions && actions.length > 0 && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {actions.map((action, index) => (
                            <DropdownMenuItem
                              key={index}
                              onClick={() => action.onClick(item)}
                              className={`cursor-pointer ${action.className || ""}`}
                            >
                              {action.icon} {action.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {renderPagination()}
    </div>
  );
}
