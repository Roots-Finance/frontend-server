// app/components/dashboard/investment/components/ResourcesSection.tsx
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, ExternalLink } from "lucide-react";
import { ResourcesSectionProps } from "./types";
import { Resource } from "@/components/dashboard/types";
import { getResourceColor, getResourceIcon } from "../utils";

/**
 * Component for displaying investment resources
 */
export const ResourcesSection = ({ sectionData, isLessonsLoading }: ResourcesSectionProps): React.ReactElement => {
  return (
    <div>
      <h3 className="text-xl font-medium mb-4 flex items-center">
        <FileText className="mr-2 h-5 w-5 text-primary" />
        Helpful Resources
      </h3>

      {isLessonsLoading ? (
        <div className="flex items-center justify-center py-4">
          <div className="text-center">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading resources...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sectionData?.resources?.length ? (
            sectionData.resources.map((resource: Resource) => (
              <Card key={resource.id} className="overflow-hidden border">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-base">{resource.title}</h4>
                    <Badge className={`ml-2 ${getResourceColor(resource.type)}`}>
                      <span className="flex items-center">
                        {getResourceIcon(resource.type)}
                        <span className="ml-1">{resource.type}</span>
                      </span>
                    </Badge>
                  </div>
                  {resource.description && <p className="text-sm text-muted-foreground mb-4">{resource.description}</p>}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2 flex items-center justify-center"
                    onClick={() => window.open(resource.url, "_blank")}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Resource
                  </Button>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-muted-foreground col-span-3">No resources available at this time.</p>
          )}
        </div>
      )}
    </div>
  );
};


export default ResourcesSection;