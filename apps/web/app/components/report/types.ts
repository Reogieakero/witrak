export type ReportFeeOption = {
  id: string;
  title: string;
  amount: string;
  dueDate: string;
};

export type ReportEventOption = {
  id: string;
  title: string;
  date: string;
};

export type ReportPageProps = {
  fees: ReportFeeOption[];
  events: ReportEventOption[];
};
