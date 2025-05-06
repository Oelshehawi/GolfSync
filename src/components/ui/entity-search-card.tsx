"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { LoadingSpinner } from "~/components/ui/loading-spinner";
import { SearchBar } from "~/components/ui/search-bar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

interface Entity {
  id: number;
  firstName: string;
  lastName: string;
  [key: string]: any; // For additional properties
}

interface SelectOption {
  id: number;
  label: string;
  value: string;
}

interface EntitySearchCardProps<T extends Entity> {
  title: string;
  searchQuery: string;
  onSearch: (query: string) => void;
  searchResults: T[];
  isLoading: boolean;
  onAddEntity: (entityId: number) => Promise<void> | void;
  isEntityLimitReached?: boolean;
  showSelectFilter?: boolean;
  selectOptions?: SelectOption[];
  selectedFilterId?: number | null;
  onFilterSelect?: (id: number) => void;
  renderEntityCard: (entity: T) => React.ReactNode;
  searchPlaceholder?: string;
  noResultsMessage?: string;
  limitReachedMessage?: string;

}

export function EntitySearchCard<T extends Entity>({
  title,
  searchQuery,
  onSearch,
  searchResults,
  isLoading,
  onAddEntity,
  isEntityLimitReached = false,
  showSelectFilter = false,
  selectOptions = [],
  selectedFilterId = null,
  onFilterSelect,
  renderEntityCard,
  searchPlaceholder = "Search...",
  noResultsMessage = "No results found matching your search",
  limitReachedMessage = "The limit has been reached. Remove an item before adding more.",
}: EntitySearchCardProps<T>) {
  const [localQuery, setLocalQuery] = useState(searchQuery);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <UserPlus className="h-5 w-5" />
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div
            className={`grid grid-cols-1 gap-4 ${showSelectFilter ? "md:grid-cols-2" : ""}`}
          >
            <SearchBar
              value={localQuery}
              onChange={(value) => {
                setLocalQuery(value);
                onSearch(value);
              }}
              placeholder={searchPlaceholder}
            />

            {showSelectFilter && onFilterSelect && (
              <Select
                value={selectedFilterId?.toString() || ""}
                onValueChange={(value) => onFilterSelect(parseInt(value))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                  {selectOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {isEntityLimitReached && (
            <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-3 text-yellow-800">
              {limitReachedMessage}
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-4">
              <LoadingSpinner />
            </div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-3">
              {searchResults.map((entity) => renderEntityCard(entity))}
            </div>
          ) : localQuery ? (
            <div className="rounded-lg border border-dashed p-4 text-center text-gray-500">
              {noResultsMessage}
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
