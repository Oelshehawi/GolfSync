import { db } from "~/server/db";

export default async function HomePage() {
  const members = await db.query.members.findMany();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
          GolfSync
        </h1>

        <div className="w-full max-w-2xl">
          <h2 className="mb-4 text-2xl font-bold">Members</h2>

          {members.length === 0 ? (
            <p className="text-center text-white/70">
              No members found. Add some members to get started.
            </p>
          ) : (
            <ul className="space-y-4">
              {members.map((member) => (
                <li
                  key={member.id}
                  className="rounded-lg bg-white/10 p-4 hover:bg-white/20"
                >
                  <h3 className="text-xl font-bold">
                    {member.firstName} {member.lastName}
                  </h3>
                  <p className="text-sm text-white/70">
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
