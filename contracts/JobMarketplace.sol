// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
}

contract JobMarketplace {
    address public constant USDC = 0xd5118dEe968d1533B2A57aB66C266010AD8957fa;

    struct Job {
        uint256 id;
        string title;
        string jobType;
        uint256 reward;
        address token; // address(0) = zkLTC, else USDC
        address poster;
        uint256 maxWorkers;
        uint256 claimedCount;
        bool active;
    }

    uint256 public jobCount;
    mapping(uint256 => Job) public jobs;
    mapping(uint256 => mapping(address => bool)) public hasClaimed;
    mapping(uint256 => mapping(address => bool)) public proofSubmitted;
    mapping(uint256 => mapping(address => bool)) public paid;
    mapping(uint256 => address[]) public claimants;
    mapping(uint256 => mapping(address => bool)) public disputed;

    event JobPosted(uint256 indexed id, address indexed poster, uint256 reward, address token);
    event JobClaimed(uint256 indexed id, address indexed worker);
    event ProofSubmitted(uint256 indexed id, address indexed worker, string proofHash);
    event PaymentReleased(uint256 indexed id, address indexed worker, uint256 amount);
    event JobDeactivated(uint256 indexed id);
    event DisputeRaised(uint256 indexed jobId, address indexed worker, address indexed initiator, string reason);
    event DisputeResolved(uint256 indexed jobId, address indexed worker, bool cancelled);

    function postJobNative(
        string memory _title,
        string memory _type,
        uint256 _maxWorkers
    ) external payable {
        require(msg.value > 0, "Reward required");
        require(_maxWorkers > 0, "Need at least 1 worker");
        require(msg.value >= _maxWorkers, "Value too small");

        uint256 rewardPerWorker = msg.value / _maxWorkers;

        jobCount++;
        jobs[jobCount] = Job({
            id: jobCount,
            title: _title,
            jobType: _type,
            reward: rewardPerWorker,
            token: address(0),
            poster: msg.sender,
            maxWorkers: _maxWorkers,
            claimedCount: 0,
            active: true
        });

        emit JobPosted(jobCount, msg.sender, msg.value, address(0));
    }

    function postJobUSDC(
        string memory _title,
        string memory _type,
        uint256 _reward,
        uint256 _maxWorkers
    ) external {
        require(_reward > 0, "Reward required");
        require(_maxWorkers > 0, "Need at least 1 worker");

        uint256 totalAmount = _reward * _maxWorkers;
        require(IERC20(USDC).transferFrom(msg.sender, address(this), totalAmount), "USDC transfer failed");

        jobCount++;
        jobs[jobCount] = Job({
            id: jobCount,
            title: _title,
            jobType: _type,
            reward: _reward,
            token: USDC,
            poster: msg.sender,
            maxWorkers: _maxWorkers,
            claimedCount: 0,
            active: true
        });

        emit JobPosted(jobCount, msg.sender, totalAmount, USDC);
    }

    function claimJob(uint256 _jobId) external {
        Job storage job = jobs[_jobId];
        require(job.active, "Job not active");
        require(job.claimedCount < job.maxWorkers, "No slots left");
        require(!hasClaimed[_jobId][msg.sender], "Already claimed");

        hasClaimed[_jobId][msg.sender] = true;
        job.claimedCount++;
        claimants[_jobId].push(msg.sender);

        emit JobClaimed(_jobId, msg.sender);
    }

    function submitProof(uint256 _jobId, string memory _proofHash) external {
        require(hasClaimed[_jobId][msg.sender], "Not claimed this job");
        require(!proofSubmitted[_jobId][msg.sender], "Proof already submitted");
        proofSubmitted[_jobId][msg.sender] = true;
        emit ProofSubmitted(_jobId, msg.sender, _proofHash);
    }

    function releasePayment(uint256 _jobId, address _worker) external {
        Job storage job = jobs[_jobId];
        require(msg.sender == job.poster, "Only poster can release");
        require(proofSubmitted[_jobId][_worker], "No proof submitted");
        require(!paid[_jobId][_worker], "Already paid");
        require(job.active, "Job not active");

        paid[_jobId][_worker] = true;

        if (job.token == address(0)) {
            (bool sent, ) = payable(_worker).call{value: job.reward}("");
            require(sent, "zkLTC transfer failed");
        } else {
            require(IERC20(job.token).transfer(_worker, job.reward), "Token transfer failed");
        }

        emit PaymentReleased(_jobId, _worker, job.reward);
    }

    function deactivateJob(uint256 _jobId) external {
        Job storage job = jobs[_jobId];
        require(msg.sender == job.poster, "Only poster");
        require(job.active, "Already inactive");
        require(job.claimedCount == 0, "Workers already claimed");
        job.active = false;

        uint256 totalEscrowed = job.reward * job.maxWorkers;

        if (job.token == address(0)) {
            (bool sent, ) = payable(msg.sender).call{value: totalEscrowed}("");
            require(sent, "zkLTC refund failed");
        } else {
            require(IERC20(job.token).transfer(msg.sender, totalEscrowed), "Token refund failed");
        }

        emit JobDeactivated(_jobId);
    }

    function raiseDispute(uint256 _jobId, address _worker, string memory _reason) external {
        require(jobs[_jobId].active, "Job not active");
        require(msg.sender == jobs[_jobId].poster || msg.sender == _worker, "Not authorized");
        require(hasClaimed[_jobId][_worker], "Worker hasn't claimed");
        require(!disputed[_jobId][_worker], "Already disputed");
        disputed[_jobId][_worker] = true;
        emit DisputeRaised(_jobId, _worker, msg.sender, _reason);
    }

    function resolveDispute(uint256 _jobId, address _worker, bool _acceptCancellation) external {
        require(disputed[_jobId][_worker], "No dispute");
        disputed[_jobId][_worker] = false;

        if (_acceptCancellation) {
            require(msg.sender == _worker, "Only worker can accept cancellation");
            require(jobs[_jobId].claimedCount > 0, "No claims to cancel");
            hasClaimed[_jobId][_worker] = false;
            proofSubmitted[_jobId][_worker] = false;
            unchecked {
                jobs[_jobId].claimedCount--;
            }
        }

        emit DisputeResolved(_jobId, _worker, _acceptCancellation);
    }
}
