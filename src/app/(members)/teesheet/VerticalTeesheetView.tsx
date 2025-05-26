{
  /* Traditional Vertical Teesheet View */
}
<div className="rounded-lg border shadow">
  <table className="w-full table-auto">
    <thead className="bg-gray-100 text-xs font-semibold text-gray-600 uppercase">
      <tr>
        <th className="w-[10%] px-3 py-2 text-left whitespace-nowrap">Time</th>
        <th className="w-[12%] px-3 py-2 text-left whitespace-nowrap">
          Status
        </th>
        <th className="w-[60%] px-3 py-2 text-left">Players</th>
        <th className="w-[18%] px-3 py-2 text-left">Actions</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-gray-200">
      {timeBlocks.map((block) => (
        <TimeBlockComponent
          key={`timeblock-${block.id}`}
          timeBlock={{
            ...block,
            startTime: block.startTime,
            endTime: block.endTime,
            date: block.date || teesheet.date,
            members: block.members || [],
            guests: block.guests || [],
          }}
          onRestrictionViolation={onRestrictionViolation}
          setPendingAction={setPendingAction}
          paceOfPlay={paceOfPlayMap.get(block.id) || null}
          showMemberClass={true}
          onRemoveMember={(memberId: number) =>
            onRemoveMember(block.id, memberId)
          }
          onRemoveGuest={(guestId: number) => onRemoveGuest(block.id, guestId)}
          onRemoveFill={(fillId: number) => onRemoveFill(block.id, fillId)}
          onCheckInMember={(memberId: number, isCheckedIn: boolean) =>
            onCheckInMember(block.id, memberId, isCheckedIn)
          }
          onCheckInGuest={(guestId: number, isCheckedIn: boolean) =>
            onCheckInGuest(block.id, guestId, isCheckedIn)
          }
          onCheckInAll={() => onCheckInAll(block.id)}
          onSaveNotes={(notes: string) => onSaveNotes(block.id, notes)}
          viewMode="vertical"
        />
      ))}
    </tbody>
  </table>
</div>;
