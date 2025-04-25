"use client";

import { Pencil, Trash } from "lucide-react";
import type { Member } from "~/app/types/MemberTypes";
import {
  BaseDataTable,
  type ActionDef,
  type ColumnDef,
} from "~/components/ui/BaseDataTable";
import { ThemeConfig } from "~/app/types/UITypes";

interface MembersTableProps {
  members: Member[];
  onEdit?: (member: Member) => void;
  onDelete?: (member: Member) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showSearch?: boolean;
  title?: string;
  emptyMessage?: string;
  theme?: ThemeConfig;
}

export function MembersTable({
  members,
  onEdit,
  onDelete,
  currentPage,
  totalPages,
  onPageChange,
  showSearch = false,
  title = "Members",
  emptyMessage = "No members found",
  theme,
}: MembersTableProps) {
  const columns: ColumnDef<Member>[] = [
    {
      header: "Member Number",
      accessorKey: "memberNumber",
    },
    {
      header: "Name",
      cell: (member) => `${member.firstName} ${member.lastName}`,
    },
    {
      header: "Class",
      accessorKey: "class",
    },
    {
      header: "Email",
      accessorKey: "email",
    },
  ];

  const actions: ActionDef<Member>[] = [];

  if (onEdit) {
    actions.push({
      label: "Edit",
      icon: <Pencil className="mr-2 h-4 w-4" />,
      onClick: onEdit,
    });
  }

  if (onDelete) {
    actions.push({
      label: "Delete",
      icon: <Trash className="mr-2 h-4 w-4" />,
      onClick: onDelete,
      className: "text-red-600",
    });
  }

  const filterMembers = (member: Member, searchTerm: string) => {
    const term = searchTerm.toLowerCase();
    return (
      `${member.firstName} ${member.lastName}`.toLowerCase().includes(term) ||
      member.email.toLowerCase().includes(term) ||
      member.memberNumber.toLowerCase().includes(term) ||
      member.class.toLowerCase().includes(term)
    );
  };

  return (
    <BaseDataTable
      data={members}
      columns={columns}
      actions={actions}
      showSearch={showSearch}
      searchPlaceholder="Search members..."
      emptyMessage={emptyMessage}
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={onPageChange}
      filterFunction={filterMembers}
      theme={theme}
    />
  );
}
