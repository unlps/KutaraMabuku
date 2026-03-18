import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { reviewerTable } from "@/integrations/supabase/reviewer-client";
import { useReviewerAuth } from "@/hooks/useReviewerAuth";
import ReviewerLayout from "@/components/reviewer/ReviewerLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BookOpen,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  ChevronRight,
  PlayCircle,
} from "lucide-react";
import type { BookSubmission, SubmissionStatus } from "@/types/reviewer-types";
import { useToast } from "@/hooks/use-toast";

const REVIEW_FILTERS = [
  { value: "all", label: "Todos" },
  { value: "pending_review", label: "Pendentes" },
  { value: "in_review", label: "Em Revisao" },
  { value: "approved", label: "Aprovados" },
  { value: "rejected", label: "Recusados" },
  { value: "revision_requested", label: "Revisao Pedida" },
] as const;

const ReviewerQueue = () => {
  const { reviewerProfile, isLoading } = useReviewerAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [submissions, setSubmissions] = useState<BookSubmission[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!isLoading && reviewerProfile) {
      fetchSubmissions();
    }
  }, [isLoading, reviewerProfile]);

  const fetchSubmissions = async () => {
    setLoadingData(true);
    try {
      const { data, error } = await reviewerTable("book_submissions")
        .select(`
          *,
          ebook:ebooks(title, cover_image, author, genre, pages, type, description),
          submitter:profiles!book_submissions_submitted_by_fkey(full_name, avatar_url, email)
        `)
        .order("submitted_at", { ascending: false });

      if (error) throw error;
      setSubmissions((data as unknown as BookSubmission[]) || []);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      toast({
        title: "Erro ao carregar fila",
        description: "Nao foi possivel carregar as submissoes.",
        variant: "destructive",
      });
    } finally {
      setLoadingData(false);
    }
  };

  const filteredSubmissions = useMemo(() => {
    let filtered = [...submissions];

    if (statusFilter !== "all") {
      filtered = filtered.filter((submission) => submission.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (submission) =>
          submission.ebook?.title?.toLowerCase().includes(query) ||
          submission.ebook?.author?.toLowerCase().includes(query) ||
          submission.submitter?.full_name?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [searchQuery, statusFilter, submissions]);

  const handleStartReview = async (submissionId: string) => {
    try {
      const { error } = await reviewerTable("book_submissions")
        .update({
          status: "in_review" as SubmissionStatus,
          reviewer_id: reviewerProfile?.id,
        })
        .eq("id", submissionId);

      if (error) throw error;

      toast({
        title: "Revisao iniciada",
        description: "O livro foi atribuido a si para revisao.",
      });

      navigate(`/reviewer/book/${submissionId}`);
    } catch {
      toast({
        title: "Erro",
        description: "Nao foi possivel iniciar a revisao.",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending_review":
        return <Clock className="h-4 w-4 text-amber-500" />;
      case "in_review":
        return <BookOpen className="h-4 w-4 text-blue-500" />;
      case "approved":
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "revision_requested":
        return <AlertTriangle className="h-4 w-4 text-purple-500" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending_review":
        return "Pendente";
      case "in_review":
        return "Em Revisao";
      case "approved":
        return "Aprovado";
      case "rejected":
        return "Recusado";
      case "revision_requested":
        return "Revisao Pedida";
      default:
        return status;
    }
  };

  const getStatusBadgeClasses = (status: string) => {
    switch (status) {
      case "pending_review":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      case "in_review":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "approved":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case "rejected":
        return "bg-red-500/10 text-red-600 border-red-500/20";
      case "revision_requested":
        return "bg-purple-500/10 text-purple-600 border-purple-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getDaysAgo = (dateStr: string) => {
    const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return "Hoje";
    if (days === 1) return "Ontem";
    return `Ha ${days} dias`;
  };

  const getFilterCount = (filterValue: string) => {
    if (filterValue === "all") return submissions.length;
    return submissions.filter((submission) => submission.status === filterValue).length;
  };

  const stripHtml = (html: string) => {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  if (isLoading) return null;

  return (
    <ReviewerLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Fila de Revisao</h2>
          <p className="mt-1 text-muted-foreground">Livros submetidos para validacao.</p>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {REVIEW_FILTERS.map((filter) => {
              const isActive = statusFilter === filter.value;

              return (
                <Button
                  key={filter.value}
                  type="button"
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(filter.value)}
                  className={`h-9 rounded-full ${isActive ? "bg-gradient-primary hover:opacity-90" : ""}`}
                >
                  {filter.label}
                  <span className="ml-2 rounded-full bg-black/10 px-2 py-0.5 text-[11px] font-semibold">
                    {getFilterCount(filter.value)}
                  </span>
                </Button>
              );
            })}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por titulo, autor ou submitter..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-11 w-52">
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  {REVIEW_FILTERS.map((filter) => (
                    <SelectItem key={filter.value} value={filter.value}>
                      {filter.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          {filteredSubmissions.length} resultado{filteredSubmissions.length !== 1 ? "s" : ""}
        </p>

        {loadingData ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse p-5">
                <div className="flex items-center gap-4">
                  <div className="h-20 w-14 rounded-lg bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 rounded bg-muted" />
                    <div className="h-3 w-1/4 rounded bg-muted" />
                    <div className="h-3 w-1/5 rounded bg-muted" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <Card className="p-12 text-center">
            <BookOpen className="mx-auto mb-4 h-16 w-16 text-muted-foreground opacity-50" />
            <h4 className="mb-2 text-lg font-semibold">Nenhuma submissao encontrada</h4>
            <p className="text-sm text-muted-foreground">
              {searchQuery || statusFilter !== "all"
                ? "Tente ajustar os filtros de pesquisa."
                : "Ainda nao existem livros submetidos para revisao."}
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredSubmissions.map((submission) => {
              const isUrgent =
                submission.status === "pending_review" &&
                (Date.now() - new Date(submission.submitted_at).getTime()) / (1000 * 60 * 60 * 24) > 3;

              return (
                <Card
                  key={submission.id}
                  className={`group cursor-pointer border p-5 transition-all duration-200 hover:shadow-card ${
                    isUrgent ? "border-amber-500/30 bg-amber-500/5" : ""
                  }`}
                  onClick={() => navigate(`/reviewer/book/${submission.id}`)}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-20 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-primary shadow-sm">
                      {submission.ebook?.cover_image ? (
                        <img src={submission.ebook.cover_image} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <BookOpen className="h-7 w-7 text-white" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="truncate text-sm font-semibold transition-colors group-hover:text-primary">
                          {stripHtml(submission.ebook?.title || "Sem titulo")}
                        </h4>
                        {isUrgent && (
                          <span className="inline-flex flex-shrink-0 items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                            URGENTE
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        por {submission.submitter?.full_name || "Desconhecido"}
                        {submission.ebook?.genre && ` · ${submission.ebook.genre}`}
                        {submission.ebook?.pages && ` · ${submission.ebook.pages} pags`}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">{getDaysAgo(submission.submitted_at)}</p>
                    </div>

                    <div className="hidden flex-shrink-0 sm:block">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${getStatusBadgeClasses(
                          submission.status
                        )}`}
                      >
                        {getStatusIcon(submission.status)}
                        {getStatusLabel(submission.status)}
                      </span>
                    </div>

                    <div className="flex-shrink-0">
                      {submission.status === "pending_review" ? (
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartReview(submission.id);
                          }}
                          className="h-9 bg-gradient-primary hover:opacity-90"
                        >
                          <PlayCircle className="mr-1 h-4 w-4" />
                          <span className="hidden sm:inline">Iniciar</span>
                        </Button>
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </ReviewerLayout>
  );
};

export default ReviewerQueue;
