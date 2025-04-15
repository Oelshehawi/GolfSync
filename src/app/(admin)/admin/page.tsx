import { db } from "~/server/db";

export default async function HomePage() {
  const members = await db.query.members.findMany();

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex flex-col items-center justify-center gap-8">
        <h1 className="text-4xl font-bold">Dashboard</h1>

        <div className="w-full max-w-4xl">
          <h2 className="mb-4 text-2xl font-bold">Members</h2>

          {members.length === 0 ? (
            <p className="text-center">
              No members found. Add some members to get started.
            </p>
          ) : (
            <ul className="space-y-4">
              {members.map((member) => (
                <li
                  key={member.id}
                  className="rounded-lg bg-white p-4 shadow-md transition-shadow hover:shadow-lg"
                >
                  <h3 className="text-xl font-bold">
                    {member.firstName} {member.lastName}
                  </h3>
                  <p className="text-sm">
                    Created: {member.createdAt.toLocaleDateString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
