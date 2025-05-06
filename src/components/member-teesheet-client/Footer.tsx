export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-100 p-4 text-center text-sm text-gray-600">
      &copy; {currentYear} GolfSync. All rights reserved.
    </footer>
  );
};
