import { ChevronRight, Home } from "lucide-react";
import { Link } from "wouter";

interface BreadcrumbProps {
    items: { _id: string; name: string }[];
    currentItem?: { _id: string; name: string };
}

export function Breadcrumb({ items, currentItem }: BreadcrumbProps) {
    return (
        <nav className="flex items-center space-x-1 text-sm text-muted-foreground mb-4">
            <Link href="/dashboard" className="flex items-center hover:text-foreground transition-colors">
                <Home className="h-4 w-4" />
                <span className="sr-only">Home</span>
            </Link>

            {items.map((item) => (
                <div key={item._id} className="flex items-center">
                    <ChevronRight className="h-4 w-4 mx-1" />
                    <Link
                        href={`/dashboard/folders/${item._id}`}
                        className="hover:text-foreground transition-colors truncate max-w-[150px]"
                    >
                        {item.name}
                    </Link>
                </div>
            ))}

            {currentItem && (
                <div className="flex items-center">
                    <ChevronRight className="h-4 w-4 mx-1" />
                    <span className="font-medium text-foreground truncate max-w-[200px]">
                        {currentItem.name}
                    </span>
                </div>
            )}
        </nav>
    );
}
