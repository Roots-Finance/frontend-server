import React, { useEffect, useState } from 'react';
import { apiService } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface TaxDeduction {
  Amount: number;
  Name: string;
  Reason: string;
}

interface YearSummary {
  PotentialDeductions: TaxDeduction[];
  TaxLiability: number | null;
  TaxableIncome: number;
  TotalPotentialDeductions: number;
}

interface TaxData {
  IncomeSummary: {
    [year: string]: YearSummary;
  };
  TaxYearsCovered: string[];
}

export const TaxSection: React.FC<{ user: any }> = ({ user }) => {
  const [taxData, setTaxData] = useState<TaxData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeYear, setActiveYear] = useState<string>("");

  useEffect(() => {
    const fetchTaxData = async () => {
        if (!user?.sub) return;
      try {
        setLoading(true);
        const data = await apiService.getUserTaxes(user.sub);
        setTaxData(data);
        
        // Set the most recent year as active by default
        if (data.TaxYearsCovered.length > 0) {
          const sortedYears = [...data.TaxYearsCovered].sort((a, b) => parseInt(b) - parseInt(a));
          setActiveYear(sortedYears[0]);
        }
      } catch (err) {
        console.error("Error fetching tax data:", err);
        setError("Failed to load tax information. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (user?.sub) {
      fetchTaxData();
    }
  }, [user]);

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading tax information...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  if (!taxData || taxData.TaxYearsCovered.length === 0) {
    return <div className="p-4">No tax information available.</div>;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Tax Information</CardTitle>
        <CardDescription>
          View your tax summary and potential deductions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeYear} onValueChange={setActiveYear}>
          <TabsList className="mb-4">
            {taxData.TaxYearsCovered.map((year) => (
              <TabsTrigger key={year} value={year}>
                {year} Tax Year
              </TabsTrigger>
            ))}
          </TabsList>

          {taxData.TaxYearsCovered.map((year) => {
            const yearData = taxData.IncomeSummary[year];
            return (
              <TabsContent key={year} value={year} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Income Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <dl className="space-y-2">
                        <div className="flex justify-between">
                          <dt className="font-medium">Taxable Income:</dt>
                          <dd>${yearData.TaxableIncome.toLocaleString()}</dd>
                        </div>
                        {yearData.TaxLiability !== null && (
                          <div className="flex justify-between">
                            <dt className="font-medium">Tax Liability:</dt>
                            <dd>${yearData.TaxLiability.toLocaleString()}</dd>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <dt className="font-medium">Total Potential Deductions:</dt>
                          <dd>${yearData.TotalPotentialDeductions.toLocaleString()}</dd>
                        </div>
                      </dl>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Potential Deductions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {yearData.PotentialDeductions.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Deduction</TableHead>
                              <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {yearData.PotentialDeductions
                              .filter(deduction => deduction.Name && deduction.Amount)
                              .map((deduction, index) => (
                                <TableRow key={index}>
                                  <TableCell>{deduction.Name}</TableCell>
                                  <TableCell className="text-right">${deduction.Amount.toLocaleString()}</TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p>No potential deductions found.</p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {yearData.PotentialDeductions.some(d => d.Reason) && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Deduction Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {yearData.PotentialDeductions
                          .filter(d => d.Name && d.Reason)
                          .map((deduction, index) => (
                            <div key={index} className="border-b pb-2 last:border-0">
                              <h4 className="font-medium">{deduction.Name} (${deduction.Amount})</h4>
                              <p className="text-sm text-gray-500">{deduction.Reason}</p>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TaxSection;