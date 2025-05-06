export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="container mx-auto max-w-6xl py-8">{children}</div>;
}
