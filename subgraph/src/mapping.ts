import { BigInt } from "@graphprotocol/graph-ts"
import {
  JobPosted as JobPostedEvent,
  JobClaimed as JobClaimedEvent,
  PaymentReleased as PaymentReleasedEvent,
  JobDeactivated as JobDeactivatedEvent,
  ProofSubmitted as ProofSubmittedEvent,
  DisputeRaised as DisputeRaisedEvent,
  DisputeResolved as DisputeResolvedEvent,
  ReputationSnapshotUpdated as ReputationSnapshotUpdatedEvent,
} from "../generated/JobMarketplace/JobMarketplace"
import {
  Worker,
  Job,
  Claim,
  Payment,
  ProofSubmission,
  Dispute,
} from "../generated/schema"

export function handleJobPosted(event: JobPostedEvent): void {
  let job = new Job(event.params.id.toString())
  job.poster = event.params.poster
  job.reward = event.params.reward
  job.token = event.params.token
  job.active = true
  job.save()
}

export function handleJobClaimed(event: JobClaimedEvent): void {
  let workerId = event.params.worker.toHexString()
  let worker = Worker.load(workerId)
  if (worker == null) {
    worker = new Worker(workerId)
    worker.address = event.params.worker
    worker.jobsClaimed = BigInt.zero()
    worker.jobsPaid = BigInt.zero()
    worker.totalEarned = BigInt.zero()
    worker.lastUpdated = BigInt.zero()
  }
  worker.jobsClaimed = worker.jobsClaimed.plus(BigInt.fromI32(1))
  worker.lastUpdated = event.block.timestamp
  worker.save()

  let job = Job.load(event.params.id.toString())
  if (job == null) return

  let claim = new Claim(
    event.params.id.toString() + "-" + workerId
  )
  claim.job = job.id
  claim.worker = worker.id
  claim.timestamp = event.block.timestamp
  claim.save()
}

export function handlePaymentReleased(event: PaymentReleasedEvent): void {
  let workerId = event.params.worker.toHexString()
  let worker = Worker.load(workerId)
  if (worker == null) {
    worker = new Worker(workerId)
    worker.address = event.params.worker
    worker.jobsClaimed = BigInt.zero()
    worker.jobsPaid = BigInt.zero()
    worker.totalEarned = BigInt.zero()
    worker.lastUpdated = BigInt.zero()
    worker.save()
  }

  let job = Job.load(event.params.id.toString())
  if (job == null) return

  let payment = new Payment(
    event.params.id.toString() + "-" + workerId
  )
  payment.job = job.id
  payment.worker = worker.id
  payment.amount = event.params.amount
  payment.timestamp = event.block.timestamp
  payment.save()
}

export function handleJobDeactivated(event: JobDeactivatedEvent): void {
  let job = Job.load(event.params.id.toString())
  if (job == null) return
  job.active = false
  job.save()
}

export function handleProofSubmitted(event: ProofSubmittedEvent): void {
  let workerId = event.params.worker.toHexString()

  let job = Job.load(event.params.id.toString())
  if (job == null) return

  let worker = Worker.load(workerId)
  if (worker == null) {
    worker = new Worker(workerId)
    worker.address = event.params.worker
    worker.jobsClaimed = BigInt.zero()
    worker.jobsPaid = BigInt.zero()
    worker.totalEarned = BigInt.zero()
    worker.lastUpdated = BigInt.zero()
    worker.save()
  }

  let proof = new ProofSubmission(
    event.params.id.toString() + "-" + workerId
  )
  proof.job = job.id
  proof.worker = worker.id
  proof.proofHash = event.params.proofHash
  proof.timestamp = event.block.timestamp
  proof.save()
}

export function handleDisputeRaised(event: DisputeRaisedEvent): void {
  let workerId = event.params.worker.toHexString()
  let disputeId = event.params.jobId.toString() + "-" + workerId

  let job = Job.load(event.params.jobId.toString())
  if (job == null) return

  let worker = Worker.load(workerId)
  if (worker == null) {
    worker = new Worker(workerId)
    worker.address = event.params.worker
    worker.jobsClaimed = BigInt.zero()
    worker.jobsPaid = BigInt.zero()
    worker.totalEarned = BigInt.zero()
    worker.lastUpdated = BigInt.zero()
    worker.save()
  }

  let dispute = new Dispute(disputeId)
  dispute.job = job.id
  dispute.worker = worker.id
  dispute.initiator = event.params.initiator
  dispute.reason = event.params.reason
  dispute.resolved = false
  dispute.timestamp = event.block.timestamp
  dispute.save()
}

export function handleDisputeResolved(event: DisputeResolvedEvent): void {
  let workerId = event.params.worker.toHexString()

  let dispute = Dispute.load(
    event.params.jobId.toString() + "-" + workerId
  )
  if (dispute == null) return

  dispute.resolved = true
  dispute.acceptedCancellation = event.params.cancelled
  dispute.save()

  if (event.params.cancelled) {
    let worker = Worker.load(workerId)
    if (worker != null && worker.jobsClaimed > BigInt.zero()) {
      worker.jobsClaimed = worker.jobsClaimed.minus(BigInt.fromI32(1))
      worker.save()
    }
  }
}

export function handleReputationSnapshotUpdated(
  event: ReputationSnapshotUpdatedEvent
): void {
  let workerId = event.params.worker.toHexString()
  let worker = Worker.load(workerId)
  if (worker == null) {
    worker = new Worker(workerId)
    worker.address = event.params.worker
    worker.jobsClaimed = BigInt.zero()
    worker.jobsPaid = BigInt.zero()
    worker.totalEarned = BigInt.zero()
  }
  worker.jobsClaimed = event.params.jobsClaimed
  worker.jobsPaid = event.params.jobsPaid
  worker.totalEarned = event.params.totalEarned
  worker.lastUpdated = event.block.timestamp
  worker.reputationHash = event.params.reputationHash
  worker.save()
}
