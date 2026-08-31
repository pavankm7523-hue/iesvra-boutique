import { createFileRoute, Link } from "@tanstack/react-router";
import { Globe, Image as ImageIcon, Layers } from "lucide-react";

export const Route = createFileRoute("/admin/content")({
  component: ContentManagement,
});

function ContentManagement() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-display font-bold text-navy-deep flex items-center gap-3">
          <Globe className="h-8 w-8 text-gold" /> Website content management
        </h2>
        <p className="text-navy-deep/60 mt-1">Manage banners, categories, and dynamic pages.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link to="/admin/hero" className="bg-white p-6 rounded-xl border border-border/50 shadow-sm hover:shadow-md transition-shadow block">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
              <ImageIcon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-navy-deep text-lg">Hero Banners</h3>
              <p className="text-sm text-muted-foreground">Manage homepage sliders</p>
            </div>
          </div>
        </Link>
        <Link to="/admin/categories" className="bg-white p-6 rounded-xl border border-border/50 shadow-sm hover:shadow-md transition-shadow block">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-navy-deep text-lg">Categories</h3>
              <p className="text-sm text-muted-foreground">Manage store collections</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
