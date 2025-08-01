import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

interface SearchAndFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  seUsers: Array<{ SE_UserName: string }>;
  selectedSeUser: string;
  onSeUserChange: (user: string) => void;
}

export const SearchAndFilters = ({
  searchQuery,
  onSearchChange,
  seUsers,
  selectedSeUser,
  onSeUserChange,
}: SearchAndFiltersProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      {/* Search Bar */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by Customer ID, Name, or Requested By..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* SE User Filter */}
      <div className="w-full sm:w-48">
        <Select value={selectedSeUser} onValueChange={onSeUserChange}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by SE User" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All SE Users</SelectItem>
            {seUsers.map((user) => (
              <SelectItem key={user.SE_UserName} value={user.SE_UserName}>
                {user.SE_UserName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};