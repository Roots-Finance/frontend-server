import { ResourceType } from "@/components/dashboard/types";
import { ITransaction } from "@/lib/types";
import { BookOpen, ExternalLink, FileText } from "lucide-react";

export const getTransactionColor = (trans: ITransaction) => {
  if (trans.isCredit) {
    return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
  } else {
    return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
  }

}

// Get badge color based on resource type
export const getResourceColor = (type: ResourceType) => {
  switch (type) {
    case "PDF":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    case "Video":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    case "Spreadsheet":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    case "Tool":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
    case "Article":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
    case "Data":
      return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
  }
};

// Get resource icon based on type
export const getResourceIcon = (type: ResourceType) => {
  switch (type) {
    case "PDF":
      return <FileText className="h-4 w-4" />;
    case "Video":
      return <BookOpen className="h-4 w-4" />;
    case "Spreadsheet":
      return <FileText className="h-4 w-4" />;
    default:
      return <ExternalLink className="h-4 w-4" />;
  }
};
