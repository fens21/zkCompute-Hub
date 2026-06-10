import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { Job } from "../types";
import {
  getDeadlineMs,
  formatTimeRemaining,
  formatDeadlineDate,
  COUNTDOWN_REFRESH,
} from "../utils";
import { colors, radii, fontSizes } from "../styles/tokens";
import { useIsMobile, useWindowWidth } from "../hooks/useIsMobile";
import { JOB_TYPE_CONFIGS } from "../constants/jobTypes";
type ViewMode = "grid" | "list";

export function MyJobs({
  myJobs,
  onOpenProof,
  onSubmitZKProof,
  onUnclaim,
  loading,
  submittingProof,
  onDispute,
  onResolveDispute,
  walletAddress,
}: {
  myJobs: Job[];
  onOpenProof: (job: Job) => void;
  onSubmitZKProof?: (job: Job) => void;
  onUnclaim: (jobId: number) => void;
  loading: boolean;
  submittingProof?: boolean;
  onDispute: (job: Job, worker?: string) => void;
  onResolveDispute: (job: Job, acceptCancel: boolean) => void;
  walletAddress?: string;
}) {
  const [now, setNow] = useState(Date.now());
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [confirmingUnclaim, setConfirmingUnclaim] = useState<number | null>(
    null,
  );
  const windowWidth = useWindowWidth();
  const isMobile = useIsMobile();
  const isTablet = windowWidth >= 768 && windowWidth < 1024;
  const navigate = useNavigate();

  useEffect(() => {
    const id = setInterval(() => {
      if (!document.hidden) setNow(Date.now());
    }, COUNTDOWN_REFRESH);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (confirmingUnclaim !== null) {
      const timer = setTimeout(() => setConfirmingUnclaim(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [confirmingUnclaim]);

  if (myJobs.length === 0) {
    return (
      <div>
        <h1 style={{ fontSize: isMobile ? 20 : fontSizes.heading, margin: 0, marginBottom: 24, color: colors.gold, lineHeight: 1.3 }}>My Jobs</h1>
        <div style={{ opacity: 0.7, padding: 60, textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}></div>
          <div style={{ marginBottom: 16 }}>
            No jobs claimed yet &mdash; browse the marketplace to find work!
          </div>
          <button
            type="button"
            onClick={() => navigate("/")}
            style={{
              background: colors.gold,
              color: "#000",
              border: "none",
              padding: "10px 24px",
              fontWeight: 700,
              borderRadius: radii.sm,
              cursor: "pointer",
              fontSize: fontSizes.base,
            }}
          >
            BROWSE MARKETPLACE
          </button>
        </div>
      </div>
    );
  }

  const sortDesc = (a: Job, b: Job) => b.id - a.id;

  const activeJobs = myJobs.filter(
    (j) =>
      j.status === "claimed" &&
      (getDeadlineMs(j.createdAt, j.deadline) ?? Infinity) > now,
  ).sort(sortDesc);
  const expiredJobs = myJobs.filter(
    (j) =>
      j.status === "claimed" &&
      (getDeadlineMs(j.createdAt, j.deadline) ?? Infinity) <= now,
  ).sort(sortDesc);
  const completedJobs = myJobs.filter((j) => j.status === "completed").sort(sortDesc);
  const disputedJobs = myJobs.filter((j) => j.status === "disputed").sort(sortDesc);
  const paidJobs = myJobs.filter((j) => j.status === "paid").sort(sortDesc);

  return (
    <div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
          marginBottom: 24,
        }}
      >
        <h1 style={{ fontSize: isMobile ? 20 : fontSizes.heading, margin: 0, color: colors.gold, lineHeight: 1.3 }}>My Jobs</h1>
        <div style={{ display: "flex", gap: 4, alignSelf: "flex-end" }}>
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            aria-label="Grid view"
            aria-pressed={viewMode === "grid"}
            style={{
              background: viewMode === "grid" ? colors.gold : colors.bgElevated,
              color: viewMode === "grid" ? "#000" : colors.textMuted,
              border: "none",
              width: isMobile ? 44 : 32,
              height: isMobile ? 44 : 32,
              borderRadius: radii.sm,
              cursor: "pointer",
              fontSize: fontSizes.lg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title="Grid view"
          >
            ▦
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            aria-label="List view"
            aria-pressed={viewMode === "list"}
            style={{
              background: viewMode === "list" ? colors.gold : colors.bgElevated,
              color: viewMode === "list" ? "#000" : colors.textMuted,
              border: "none",
              width: isMobile ? 44 : 32,
              height: isMobile ? 44 : 32,
              borderRadius: radii.sm,
              cursor: "pointer",
              fontSize: fontSizes.lg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title="List view"
          >
            []
          </button>
        </div>
      </div>

      {activeJobs.length > 0 && (
        <div style={{ marginBottom: 40 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 12,
            }}
          >
            <div
              style={{
                width: 3,
                height: 16,
                background: colors.gold,
                borderRadius: 2,
              }}
            />
            <div style={{ fontSize: fontSizes.base, opacity: 0.6 }}>
              In Progress ({activeJobs.length})
            </div>
          </div>
          <JobsContainer
            viewMode={viewMode}
            isMobile={isMobile}
            isTablet={isTablet}
          >
            {activeJobs.map((job) => {
              const rewardStr = job.reward.toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 4,
              });
              const endMs = getDeadlineMs(job.createdAt, job.deadline);
              const expired = endMs !== null && endMs <= now;
              return (
                <div key={job.id}>
                  {viewMode === "list" ? (
                    <>
                      <ActiveRow
                        job={job}
                        now={now}
                        onOpenProof={onOpenProof}
                        onSubmitZKProof={onSubmitZKProof}
                        onUnclaim={onUnclaim}
                        submittingProof={submittingProof ?? false}
                        isMobile={isMobile}
                        onChat={() =>
                          navigate(`/chat/${job.id}`, {
                            state: { posterAddress: job.poster, jobTitle: job.title, hasClaimed: true, workerAddress: walletAddress },
                          })
                        }
                      />
                    </>
                  ) : (
                    <>
                      <div
                        className="job-card"
                        style={cardStyle(true, isMobile, expired)}
                    >
                      <CardHeader job={job} now={now} />
                      <div
                        style={{
                          margin: isMobile ? "8px 0" : "10px 0",
                          fontSize: 18,
                          color: colors.gold,
                          fontWeight: 700,
                          opacity: expired ? 0.6 : 1,
                        }}
                      >
                        {rewardStr} {job.tokenSymbol || "zkLTC"}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          flexDirection: isMobile ? "column" : "row",
                        }}
                      >
                        {job.type === "ZK" || job.verificationMethod === "zk-proof" ? (
                          <button
                            type="button"
                            onClick={() => onSubmitZKProof?.(job)}
                            disabled={submittingProof || expired}
                            aria-label={`Submit ZK proof for ${job.title}`}
                            style={{
                              flex: 1,
                              background:
                                submittingProof || expired ? "#555" : "#a78bfa",
                              color: "#000",
                              border: "none",
                              padding: "6px 10px",
                              fontWeight: 600,
                              borderRadius: radii.sm,
                              fontSize: fontSizes.sm,
                              minHeight: isMobile ? 44 : "auto",
                              cursor:
                                submittingProof || expired
                                  ? "not-allowed"
                                  : "pointer",
                              opacity: submittingProof || expired ? 0.5 : 1,
                            }}
                          >
                            {submittingProof
                              ? "SUBMITTING..."
                              : expired
                              ? "EXPIRED"
                              : "SUBMIT ZK PROOF"}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onOpenProof(job)}
                            disabled={submittingProof || expired}
                            aria-label={`Submit proof for ${job.title}`}
                            style={{
                              flex: 1,
                              background:
                                submittingProof || expired
                                  ? "#555"
                                  : colors.gold,
                              color: "#000",
                              border: "none",
                              padding: "6px 10px",
                              fontWeight: 600,
                              borderRadius: radii.sm,
                              fontSize: fontSizes.sm,
                              minHeight: isMobile ? 44 : "auto",
                              cursor:
                                submittingProof || expired
                                  ? "not-allowed"
                                  : "pointer",
                              opacity: submittingProof || expired ? 0.5 : 1,
                            }}
                          >
                            {submittingProof
                              ? "SUBMITTING..."
                              : expired
                              ? "EXPIRED"
                              : "SUBMIT PROOF"}

                        </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (confirmingUnclaim === job.id) {
                              onUnclaim(job.id);
                              setConfirmingUnclaim(null);
                            } else {
                              setConfirmingUnclaim(job.id);
                            }
                          }}
                          disabled={submittingProof}
                          aria-label={`Unclaim ${job.title}`}
                          style={{
                            flex: 1,
                            background:
                              confirmingUnclaim === job.id
                                ? colors.red
                                : "transparent",
                            color:
                              confirmingUnclaim === job.id
                                ? "#000"
                                : colors.red,
                            border: `1px solid ${colors.red}`,
                            padding: "6px 10px",
                            fontWeight: 600,
                            borderRadius: radii.sm,
                            fontSize: fontSizes.sm,
                            minHeight: isMobile ? 44 : "auto",
                            cursor: submittingProof ? "not-allowed" : "pointer",
                            opacity: submittingProof ? 0.4 : 1,
                          }}
                        >
                          {confirmingUnclaim === job.id
                            ? "CONFIRM UNCLAIM?"
                            : expired
                            ? "RELEASE (EXPIRED)"
                            : "UNCLAIM"}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/chat/${job.id}`, {
                              state: { posterAddress: job.poster, jobTitle: job.title, hasClaimed: true, workerAddress: walletAddress },
                            })
                          }
                          aria-label="Chat"
                          style={{
                            flex: 1,
                            background: "transparent",
                            color: colors.textMuted,
                            border: `1px solid ${colors.border}`,
                            padding: "6px 10px",
                            borderRadius: radii.sm,
                            fontWeight: 600,
                            cursor: "pointer",
                            fontSize: fontSizes.sm,
                          }}
                        >
                          CHAT
                        </button>
                      </div>
                      {expired && (
                        <div
                          style={{
                            fontSize: 9,
                            color: colors.red,
                            marginTop: 4,
                          }}
                        >
                          EXPIRED
                        </div>
                      )}
                    </div>
                    </>
                  )}
                </div>
              );
            })}
          </JobsContainer>
        </div>
      )}

      {expiredJobs.length > 0 && (
        <div style={{ marginBottom: 40 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 12,
            }}
          >
            <div
              style={{
                width: 3,
                height: 16,
                background: colors.red,
                borderRadius: 2,
              }}
            />
            <div
              style={{
                fontSize: fontSizes.base,
                opacity: 0.6,
                color: colors.red,
              }}
            >
              Expired ({expiredJobs.length})
            </div>
          </div>
          <JobsContainer
            viewMode={viewMode}
            isMobile={isMobile}
            isTablet={isTablet}
          >
            {expiredJobs.map((job) => {
              const rewardStr = job.reward.toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 4,
              });
              return (
                <div key={job.id}>
                  {viewMode === "list" ? (
                    <ActiveRow
                      job={job}
                      now={now}
                      onOpenProof={onOpenProof}
                      onSubmitZKProof={onSubmitZKProof}
                      onUnclaim={onUnclaim}
                      submittingProof={submittingProof ?? false}
                      isMobile={isMobile}
                      onChat={() =>
                        navigate(`/chat/${job.id}`, {
                          state: { posterAddress: job.poster, jobTitle: job.title, hasClaimed: true, workerAddress: walletAddress },
                        })
                      }
                    />
                  ) : (
                    <div
                      className="job-card"
                      style={cardStyle(true, isMobile, true)}
                    >
                      <CardHeader job={job} now={now} />
                      <div
                        style={{
                          margin: isMobile ? "8px 0" : "10px 0",
                          fontSize: 18,
                          color: colors.red,
                          fontWeight: 700,
                          opacity: 0.6,
                        }}
                      >
                        {rewardStr} {job.tokenSymbol || "zkLTC"}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          flexDirection: isMobile ? "column" : "row",
                        }}
                      >
                        <div
                          style={{
                            flex: 1,
                            background: "#222",
                            color: "#666",
                            border: "none",
                            padding: 10,
                            fontWeight: 700,
                            borderRadius: radii.sm,
                            textAlign: "center",
                            fontSize: fontSizes.sm,
                            cursor: "not-allowed",
                          }}
                        >
                          EXPIRED
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirmingUnclaim === job.id) {
                              onUnclaim(job.id);
                              setConfirmingUnclaim(null);
                            } else {
                              setConfirmingUnclaim(job.id);
                            }
                          }}
                          disabled={submittingProof}
                          aria-label={`Release expired job ${job.title}`}
                          style={{
                            flex: 1,
                            background:
                              confirmingUnclaim === job.id
                                ? colors.red
                                : "transparent",
                            color:
                              confirmingUnclaim === job.id
                                ? "#000"
                                : colors.red,
                            border: `1px solid ${colors.red}`,
                            padding: 10,
                            fontWeight: 600,
                            borderRadius: radii.sm,
                            cursor: submittingProof ? "not-allowed" : "pointer",
                            opacity: submittingProof ? 0.4 : 1,
                          }}
                        >
                          {confirmingUnclaim === job.id
                            ? "CONFIRM RELEASE?"
                            : "RELEASE (EXPIRED)"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </JobsContainer>
        </div>
      )}

      {completedJobs.length > 0 && (
        <div style={{ marginBottom: 40 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 12,
            }}
          >
            <div
              style={{
                width: 3,
                height: 16,
                background: colors.green,
                borderRadius: 2,
              }}
            />
            <div style={{ fontSize: fontSizes.base, opacity: 0.6 }}>
              Proof Submitted &mdash; Awaiting Payment ({completedJobs.length})
            </div>
          </div>
          <JobsContainer
            viewMode={viewMode}
            isMobile={isMobile}
            isTablet={isTablet}
          >
            {completedJobs.map((job) => {
              const rewardStr = job.reward.toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 4,
              });
              return (
                <div key={job.id}>
                  {viewMode === "list" ? (
                    <CompletedRow
                      job={job}
                      now={now}
                      onOpenProof={onOpenProof}
                      onDispute={onDispute}
                    />
                  ) : (
                    <div
                      className="job-card"
                      style={cardStyle(false, isMobile)}
                    >
                      <CardHeader job={job} now={now} />
                      <div
                        style={{
                          margin: isMobile ? "8px 0" : "10px 0",
                          fontSize: 18,
                          color: colors.gold,
                          fontWeight: 700,
                        }}
                      >
                        {rewardStr} {job.tokenSymbol || "zkLTC"}
                      </div>
                      <div
                        style={{
                          background: "#1a3c1a",
                          color: colors.green,
                          padding: "10px 14px",
                          borderRadius: radii.sm,
                          textAlign: "center",
                          fontWeight: 600,
                          fontSize: fontSizes.sm,
                          marginBottom: 8,
                        }}
                      >
                        PROOF SUBMITTED &mdash; AWAITING PAYMENT
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 6,
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => onOpenProof(job)}
                          aria-label={`Resubmit proof for ${job.title}`}
                          style={{
                            background: "transparent",
                            color: colors.blue,
                            border: `1px solid ${colors.blue}`,
                            padding: "8px 12px",
                            borderRadius: radii.sm,
                            fontWeight: 600,
                            fontSize: fontSizes.sm,
                            cursor: "pointer",
                          }}
                        >
                          RESUBMIT PROOF
                        </button>
                        <button
                          type="button"
                          onClick={() => onDispute(job)}
                          aria-label={`File dispute for ${job.title}`}
                          style={{
                            background: "transparent",
                            color: colors.orange,
                            border: `1px solid ${colors.orange}`,
                            padding: "8px 12px",
                            borderRadius: radii.sm,
                            fontWeight: 600,
                            fontSize: fontSizes.sm,
                            cursor: "pointer",
                          }}
                        >
                          FILE DISPUTE (Non-Payment)
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </JobsContainer>
        </div>
      )}

      {disputedJobs.length > 0 && (
        <div style={{ marginBottom: 40 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 12,
            }}
          >
            <div
              style={{
                width: 3,
                height: 16,
                background: colors.orange,
                borderRadius: 2,
              }}
            />
            <div
              style={{
                fontSize: fontSizes.base,
                opacity: 0.6,
                color: colors.orange,
              }}
            >
              Disputed ({disputedJobs.length})
            </div>
          </div>
          <JobsContainer
            viewMode={viewMode}
            isMobile={isMobile}
            isTablet={isTablet}
          >
            {disputedJobs.map((job) => {
              const rewardStr = job.reward.toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 4,
              });
              return (
                <div key={job.id}>
                  {viewMode === "list" ? (
                    <DisputedRow
                      job={job}
                      now={now}
                      loading={loading}
                      onResolveDispute={onResolveDispute}
                    />
                  ) : (
                    <div
                      className="job-card"
                      style={{
                        ...cardStyle(false, isMobile),
                        border: `1px solid ${colors.orange}`,
                      }}
                    >
                      <CardHeader job={job} now={now} />
                      <div
                        style={{
                          margin: isMobile ? "8px 0" : "10px 0",
                          fontSize: 18,
                          color: colors.gold,
                          fontWeight: 700,
                        }}
                      >
                        {rewardStr} {job.tokenSymbol || "zkLTC"}
                      </div>
                      <div
                        style={{
                          background: "#2a1a0a",
                          color: colors.orange,
                          padding: "10px 14px",
                          borderRadius: radii.sm,
                          textAlign: "center",
                          fontWeight: 600,
                          fontSize: fontSizes.sm,
                          marginBottom: 8,
                        }}
                      >
                        DISPUTE ACTIVE
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          flexDirection: isMobile ? "column" : "row",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => onResolveDispute(job, true)}
                          disabled={loading}
                          aria-label={`Accept cancellation for ${job.title}`}
                          style={{
                            flex: 1,
                            padding: 10,
                            background: loading ? "#555" : colors.orange,
                            color: "#000",
                            border: "none",
                            fontWeight: 700,
                            borderRadius: radii.sm,
                            cursor: loading ? "not-allowed" : "pointer",
                            fontSize: fontSizes.base,
                            opacity: loading ? 0.5 : 1,
                          }}
                          title="Accept cancellation — job removed, you lose your claim"
                        >
                          ACCEPT CANCEL
                        </button>
                        <button
                          type="button"
                          onClick={() => onResolveDispute(job, false)}
                          disabled={loading}
                          aria-label={`Reject cancellation for ${job.title}`}
                          style={{
                            flex: 1,
                            padding: 10,
                            background: "transparent",
                            color: colors.green,
                            border: `1px solid ${colors.green}`,
                            fontWeight: 600,
                            borderRadius: radii.sm,
                            cursor: loading ? "not-allowed" : "pointer",
                            fontSize: fontSizes.base,
                            opacity: loading ? 0.4 : 1,
                          }}
                          title="Reject cancellation — dispute sent for on-chain resolution"
                        >
                          REJECT CANCEL
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </JobsContainer>
        </div>
      )}

      {paidJobs.length > 0 && (
        <div style={{ marginBottom: 40 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 12,
            }}
          >
            <div
              style={{
                width: 3,
                height: 16,
                background: colors.green,
                borderRadius: 2,
              }}
            />
            <div style={{ fontSize: fontSizes.base, opacity: 0.6 }}>
              Paid ({paidJobs.length})
            </div>
          </div>
          <JobsContainer
            viewMode={viewMode}
            isMobile={isMobile}
            isTablet={isTablet}
          >
            {paidJobs.map((job) => {
              const rewardStr = job.reward.toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 4,
              });
              return (
                <div key={job.id}>
                  {viewMode === "list" ? (
                    <PaidRow job={job} now={now} />
                  ) : (
                    // SESUDAH - paid card yang lebih informatif
                    <div
                      className="job-card"
                      style={{
                        ...cardStyle(false, isMobile),
                        borderTop: `3px solid ${colors.green}`,
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      {/* Subtle green glow di pojok */}
                      <div
                        style={{
                          position: "absolute",
                          top: 0,
                          right: 0,
                          width: 80,
                          height: 80,
                          background:
                            "radial-gradient(circle at top right, rgba(74,222,128,0.08), transparent 70%)",
                          pointerEvents: "none",
                        }}
                      />

                      {/* Header: title + type badge */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: 6,
                          gap: 8,
                        }}
                      >
                        <div
                          style={{
                            fontSize: fontSizes.base,
                            fontWeight: 700,
                            lineHeight: 1.3,
                          }}
                        >
                          {job.title}
                        </div>
                        <div
                          style={{
                            background: colors.borderLight,
                            color:
                              JOB_TYPE_CONFIGS[job.type]?.color || colors.gold,
                            padding: "2px 8px",
                            borderRadius: radii.full,
                            fontSize: fontSizes.xs,
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                            flexShrink: 0,
                          }}
                        >
                          {JOB_TYPE_CONFIGS[job.type]?.label || job.type}
                        </div>
                      </div>

                      {/* Job ID */}
                      <div
                        style={{
                          fontSize: fontSizes.xs,
                          opacity: 0.4,
                          marginBottom: 6,
                          fontFamily: "monospace",
                        }}
                      >
                        Job #{job.id}
                      </div>

                      {/* Divider */}
                      <div
                        style={{
                          height: 1,
                          background: colors.borderLight,
                          marginBottom: 10,
                        }}
                      />

                      {/* Amount */}
                      <div
                        style={{
                          fontSize: 20,
                          color: colors.green,
                          fontWeight: 700,
                          marginBottom: 4,
                        }}
                      >
                        +{rewardStr}{" "}
                        <span style={{ fontSize: fontSizes.sm, opacity: 0.7 }}>
                          {job.tokenSymbol || "zkLTC"}
                        </span>
                      </div>

                      {/* Deadline info */}
                      <div
                        style={{
                          fontSize: fontSizes.xs,
                          opacity: 0.45,
                          marginBottom: 10,
                        }}
                      >
                        Deadline:{" "}
                        <CountdownValue
                          createdAt={job.createdAt}
                          deadline={job.deadline}
                          now={now}
                        />
                      </div>

                      {/* PAID badge */}
                      <div
                        style={{
                          background: "#0d2e1a",
                          border: `1px solid ${colors.green}`,
                          color: colors.green,
                          padding: "8px 14px",
                          borderRadius: radii.sm,
                          textAlign: "center",
                          fontWeight: 700,
                          fontSize: fontSizes.sm,
                          letterSpacing: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                        }}
                      >
                        <span style={{ fontSize: 12 }}>✓</span> PAID
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </JobsContainer>
        </div>
      )}
    </div>
  );
}

function cardStyle(
  active: boolean,
  isMobile?: boolean,
  expired?: boolean,
): React.CSSProperties {
  let borderColor: string = colors.borderLight;
  if (expired) borderColor = colors.red;
  else if (active) borderColor = colors.gold;
  return {
    background: colors.bgCard,
    border: `1px solid ${borderColor}`,
    borderRadius: radii.xl,
    padding: isMobile ? 12 : 16,
  };
}

function CompletedRow({
  job,
  now,
  onOpenProof,
  onDispute,
}: {
  job: Job;
  now: number;
  onOpenProof: (job: Job) => void;
  onDispute: (job: Job, worker?: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <TableRow
      job={{ ...job, status: "completed" as const }}
      now={now}
      open={open}
      onToggle={() => setOpen(!open)}
    >
      <button
        type="button"
        onClick={() => onOpenProof(job)}
        aria-label={`Resubmit proof for ${job.title}`}
        style={{
          background: "transparent",
          color: "#38bdf8",
          border: "1px solid #38bdf8",
          padding: "6px 12px",
          borderRadius: radii.sm,
          fontWeight: 600,
          fontSize: fontSizes.sm,
          cursor: "pointer",
        }}
      >
        RESUBMIT PROOF
      </button>
      <button
        type="button"
        onClick={() => onDispute(job)}
        aria-label={`File dispute for ${job.title}`}
        style={{
          background: "transparent",
          color: colors.orange,
          border: "1px solid #f97316",
          padding: "6px 12px",
          borderRadius: radii.sm,
          fontWeight: 600,
          fontSize: fontSizes.sm,
          cursor: "pointer",
        }}
      >
        FILE DISPUTE
      </button>
    </TableRow>
  );
}

function DisputedRow({
  job,
  now,
  loading,
  onResolveDispute,
}: {
  job: Job;
  now: number;
  loading: boolean;
  onResolveDispute: (job: Job, acceptCancel: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <TableRow
      job={{ ...job, status: "disputed" as const }}
      now={now}
      open={open}
      onToggle={() => setOpen(!open)}
    >
      <button
        type="button"
        onClick={() => onResolveDispute(job, true)}
        disabled={loading}
        style={{
          background: loading ? "#555" : colors.orange,
          color: "#000",
          border: "none",
          padding: "6px 12px",
          borderRadius: radii.sm,
          fontWeight: 700,
          cursor: loading ? "not-allowed" : "pointer",
          fontSize: fontSizes.sm,
          opacity: loading ? 0.5 : 1,
        }}
        title="Accept cancellation — job removed, you lose your claim"
      >
        ACCEPT CANCEL
      </button>
      <button
        type="button"
        onClick={() => onResolveDispute(job, false)}
        disabled={loading}
        style={{
          background: "transparent",
          color: colors.green,
          border: "1px solid #4ade80",
          padding: "6px 12px",
          borderRadius: radii.sm,
          fontWeight: 600,
          cursor: loading ? "not-allowed" : "pointer",
          fontSize: fontSizes.sm,
          opacity: loading ? 0.4 : 1,
        }}
        title="Reject cancellation — dispute sent for on-chain resolution"
      >
        REJECT CANCEL
      </button>
    </TableRow>
  );
}

function PaidRow({ job, now }: { job: Job; now: number }) {
  const [open, setOpen] = useState(false);
  return (
    <TableRow
      job={{ ...job, status: "paid" as const }}
      now={now}
      open={open}
      onToggle={() => setOpen(!open)}
    >
      <span
        style={{ color: colors.green, fontSize: fontSizes.sm, fontWeight: 600 }}
      >
        Payment received
      </span>
    </TableRow>
  );
}

const TABLE_COLS =
  "24px minmax(80px, 1fr) minmax(50px, 70px) minmax(70px, 110px) minmax(70px, 100px)";

function TableHeader() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: TABLE_COLS,
        padding: "10px 16px",
        borderBottom: `1px solid ${colors.borderLight}`,
        fontSize: fontSizes.xs,
        opacity: 0.45,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        background: "#0d0d0d",
      }}
    >
      <span></span>
      <span>Title</span>
      <span>Type</span>
      <span>Reward</span>
      <span>Deadline</span>
    </div>
  );
}

function JobsContainer({
  viewMode,
  children,
  isMobile,
  isTablet,
}: {
  viewMode: ViewMode;
  children: React.ReactNode;
  isMobile: boolean;
  isTablet?: boolean;
}) {
  return viewMode === "grid" ? (
    <div
      className="job-grid"
      style={{
        display: "grid",
        gridTemplateColumns: isMobile
          ? "1fr"
          : isTablet
          ? "repeat(2, 1fr)"
          : "repeat(auto-fill, minmax(280px, 1fr))",
        gap: isMobile ? 10 : 16,
      }}
    >
      {children}
    </div>
  ) : (
    <div
      style={{
        background: colors.bgCard,
        border: `1px solid ${colors.border}`,
        borderRadius: radii.xl,
        overflowX: "auto",
        overflowY: "hidden",
      }}
    >
      <TableHeader />
      {children}
    </div>
  );
}

function CardHeader({ job, now }: { job: Job; now: number }) {
  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 4,
        }}
      >
        <div style={{ fontSize: fontSizes.lg, fontWeight: 700 }}>
          {job.title}
        </div>
        <div
          style={{
            background: colors.borderLight,
            color: JOB_TYPE_CONFIGS[job.type]?.color || colors.gold,
            padding: "2px 8px",
            borderRadius: radii.full,
            fontSize: fontSizes.xs,
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          {JOB_TYPE_CONFIGS[job.type]?.label || job.type}
        </div>
      </div>
      <div style={{ fontSize: fontSizes.sm, opacity: 0.5, marginBottom: 2 }}>
        Deadline:{" "}
        <CountdownValue
          createdAt={job.createdAt}
          deadline={job.deadline}
          now={now}
        />
      </div>
    </>
  );
}

function TableRow({
  job,
  now,
  children,
  open,
  onToggle,
}: {
  job: Job;
  now: number;
  children?: React.ReactNode;
  open: boolean;
  onToggle: () => void;
}) {
  const rewardStr = job.reward.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  });
  const endMs = getDeadlineMs(job.createdAt, job.deadline);
  const expired = endMs !== null && endMs <= now;
  const statusColor =
    job.status === "paid"
      ? colors.green
      : job.status === "disputed"
      ? colors.orange
      : job.status === "completed"
      ? colors.gold
      : undefined;
  const statusLabel =
    job.status === "paid"
      ? "PAID"
      : job.status === "disputed"
      ? "DISPUTED"
      : job.status === "completed"
      ? "AWAITING RELEASE"
      : undefined;
  return (
    <div>
      <div
        onClick={onToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle();
          }
        }}
        style={{
          display: "grid",
          gridTemplateColumns: TABLE_COLS,
          padding: "10px 16px",
          borderBottom: "1px solid #1a1a1a",
          alignItems: "center",
          fontSize: fontSizes.base,
          cursor: "pointer",
          opacity: expired ? 0.65 : 1,
          transition: "background 0.15s",
          background: open ? colors.bgCard : "transparent",
        }}
      >
        <span style={{ fontSize: fontSizes.xs, opacity: 0.4 }}>
          {open ? "v" : ">"}
        </span>
        <span
          style={{
            fontWeight: 700,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {job.title}
          {expired ? " (expired)" : ""}
        </span>
        <span
          style={{
            color: JOB_TYPE_CONFIGS[job.type]?.color || colors.gold,
            fontSize: fontSizes.xs,
          }}
        >
          {JOB_TYPE_CONFIGS[job.type]?.label || job.type}
        </span>
        <span
          style={{ color: colors.gold, fontWeight: 600, whiteSpace: "nowrap" }}
        >
          {rewardStr} {job.tokenSymbol || "zkLTC"}
        </span>
        <span
          style={{
            opacity: statusLabel ? 1 : 0.5,
            color: statusColor ?? undefined,
            fontWeight: statusLabel ? 600 : 400,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontSize: statusLabel ? 10 : 11,
          }}
        >
          {statusLabel || (
            <CountdownValue
              createdAt={job.createdAt}
              deadline={job.deadline}
              now={now}
            />
          )}
        </span>
      </div>
      <div
        style={{
          maxHeight: open ? "300px" : "0",
          overflow: "hidden",
          transition: "max-height 0.25s ease",
        }}
      >
        <div
          style={{
            padding: "8px 16px 12px",
            borderBottom: "1px solid #1a1a1a",
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            background: "#0a0a0a",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function CountdownValue({
  createdAt,
  deadline,
  now,
}: {
  createdAt?: number;
  deadline: string;
  now: number;
}) {
  const endMs = getDeadlineMs(createdAt, deadline);
  if (endMs === null) return <span style={{ opacity: 0.5 }}>{deadline}</span>;
  const remaining = endMs - now;
  if (remaining <= 0)
    return (
      <span style={{ color: colors.red }}>
        {formatDeadlineDate(createdAt, deadline)} (expired)
      </span>
    );
  if (remaining < 3600000)
    return (
      <span style={{ color: colors.orange }}>
        {formatDeadlineDate(createdAt, deadline)} (
        {formatTimeRemaining(remaining)} left)
      </span>
    );
  return (
    <span style={{ color: colors.textDim }}>
      {formatDeadlineDate(createdAt, deadline)} (
      {formatTimeRemaining(remaining)} left)
    </span>
  );
}

function ActiveRow({
  job,
  now,
  onOpenProof,
  onSubmitZKProof,
  onUnclaim,
  submittingProof,
  isMobile,
  onChat,
}: {
  job: Job;
  now: number;
  onOpenProof?: (job: Job) => void;
  onSubmitZKProof?: (job: Job) => void;
  onUnclaim?: (jobId: number) => void;
  submittingProof: boolean;
  isMobile: boolean;
  onChat?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [confirmingUnclaim, setConfirmingUnclaim] = useState(false);
  const endMs = getDeadlineMs(job.createdAt, job.deadline);
  const expired = endMs !== null && endMs <= now;
  return (
    <TableRow
      job={{ ...job, status: "active" as const }}
      now={now}
      open={open}
      onToggle={() => setOpen(!open)}
    >
      <div style={{ display: "flex", gap: 8, flexDirection: "row" }}>
        {job.type === "ZK" || job.verificationMethod === "zk-proof" ? (
          <button
            type="button"
            onClick={() => onSubmitZKProof?.(job)}
            disabled={submittingProof || expired}
            aria-label={`Submit ZK proof for ${job.title}`}
            style={{
              flex: 1,
              background: submittingProof || expired ? "#555" : "#a78bfa",
              color: "#000",
              border: "none",
              padding: "6px 12px",
              borderRadius: radii.sm,
              fontWeight: 700,
              cursor: submittingProof || expired ? "not-allowed" : "pointer",
              fontSize: fontSizes.sm,
              minHeight: isMobile ? 44 : "auto",
              opacity: submittingProof || expired ? 0.5 : 1,
            }}
          >
            {submittingProof
              ? "SUBMITTING..."
              : expired
              ? "EXPIRED"
              : "SUBMIT ZK PROOF"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onOpenProof?.(job)}
            disabled={submittingProof || expired}
            aria-label={`Submit proof for ${job.title}`}
            style={{
              flex: 1,
              background: submittingProof || expired ? "#555" : colors.gold,
              color: "#000",
              border: "none",
              padding: "6px 12px",
              borderRadius: radii.sm,
              fontWeight: 700,
              cursor: submittingProof || expired ? "not-allowed" : "pointer",
              fontSize: fontSizes.sm,
              minHeight: isMobile ? 44 : "auto",
              opacity: submittingProof || expired ? 0.5 : 1,
            }}
          >
            {submittingProof
              ? "SUBMITTING..."
              : expired
              ? "EXPIRED"
              : "SUBMIT PROOF"}
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            if (confirmingUnclaim) {
              onUnclaim?.(job.id);
              setConfirmingUnclaim(false);
            } else {
              setConfirmingUnclaim(true);
              setTimeout(() => setConfirmingUnclaim(false), 5000);
            }
          }}
          disabled={submittingProof}
          aria-label={`Unclaim ${job.title}`}
          style={{
            background: confirmingUnclaim ? colors.red : "transparent",
            color: confirmingUnclaim ? "#000" : colors.red,
            border: `1px solid ${colors.red}`,
            padding: "6px 12px",
            borderRadius: radii.sm,
            fontWeight: 600,
            cursor: submittingProof ? "not-allowed" : "pointer",
            fontSize: fontSizes.sm,
            minHeight: isMobile ? 44 : "auto",
            opacity: submittingProof ? 0.4 : 1,
          }}
        >
          {confirmingUnclaim
            ? "CONFIRM UNCLAIM?"
            : expired
            ? "RELEASE (EXPIRED)"
            : "UNCLAIM"}
        </button>
        <button
          type="button"
          onClick={onChat}
          aria-label="Chat"
          style={{
            background: "transparent",
            color: colors.textMuted,
            border: `1px solid ${colors.border}`,
            padding: "6px 12px",
            borderRadius: radii.sm,
            fontWeight: 600,
            cursor: "pointer",
            fontSize: fontSizes.sm,
            minHeight: isMobile ? 44 : "auto",
          }}
        >
          CHAT
        </button>
      </div>
    </TableRow>
  );
}

export default MyJobs;
