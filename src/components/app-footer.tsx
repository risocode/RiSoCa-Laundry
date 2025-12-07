
export function AppFooter() {
  return (
    <footer className="w-full py-2">
      <div className="container mx-auto flex justify-center text-center text-xs text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} RKR Laundry. All rights reserved.</p>
      </div>
    </footer>
  );
}
