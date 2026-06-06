// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IVerifier.sol";

contract RealVerifier is IVerifier {
    uint256 constant P_MOD = 21888242871839275222246405745257275088696311157297823662689037894645226208583;

    struct G1Point {
        uint256 X;
        uint256 Y;
    }

    struct G2Point {
        uint256[2] X;
        uint256[2] Y;
    }

    struct VerifyingKey {
        G1Point alpha1;
        G2Point beta2;
        G2Point gamma2;
        G2Point delta2;
        G1Point[] IC;
    }

    VerifyingKey public vk;
    bool public vkSet;
    address public owner;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function setVerificationKey(
        G1Point memory _alpha1,
        G2Point memory _beta2,
        G2Point memory _gamma2,
        G2Point memory _delta2,
        G1Point[] memory _IC
    ) external onlyOwner {
        require(_IC.length >= 1, "IC array empty");
        vk.alpha1 = _alpha1;
        vk.beta2 = _beta2;
        vk.gamma2 = _gamma2;
        vk.delta2 = _delta2;
        delete vk.IC;
        for (uint256 i = 0; i < _IC.length; i++) {
            vk.IC.push(_IC[i]);
        }
        vkSet = true;
    }

    function verifyProof(
        uint256[2] calldata a,
        uint256[2][2] calldata b,
        uint256[2] calldata c,
        uint256[] calldata input
    ) external view returns (bool) {
        require(vkSet, "VK not set");
        require(input.length + 1 == vk.IC.length, "Input length mismatch");

        G1Point memory acc = vk.IC[0];
        for (uint256 i = 0; i < input.length; i++) {
            if (input[i] != 0) {
                acc = g1Add(acc, g1Mul(vk.IC[i + 1], input[i]));
            }
        }

        bool success;
        bool valid;
        assembly {
            let ptr := mload(0x40)
            // Pair 1: (-pi_a = -a, pi_b = b)
            // a → G1(a[0], a[1]), negated = (a[0], q-a[1])
            mstore(ptr, calldataload(a))
            mstore(add(ptr, 32), sub(P_MOD, calldataload(add(a, 32))))
            // b is uint256[2][2]: [[b00,b01],[b10,b11]] → G2(X(b00,b01), Y(b10,b11))
            mstore(add(ptr, 64), calldataload(b))
            mstore(add(ptr, 96), calldataload(add(b, 32)))
            mstore(add(ptr, 128), calldataload(add(b, 64)))
            mstore(add(ptr, 160), calldataload(add(b, 96)))
            // Pair 2: (alpha1, beta2) — α NOT negated
            mstore(add(ptr, 192), sload(vk.slot))
            mstore(add(ptr, 224), sload(add(vk.slot, 1)))
            mstore(add(ptr, 256), sload(add(vk.slot, 2)))
            mstore(add(ptr, 288), sload(add(vk.slot, 3)))
            mstore(add(ptr, 320), sload(add(vk.slot, 4)))
            mstore(add(ptr, 352), sload(add(vk.slot, 5)))
            // Pair 3: (accumulator, gamma2) — vk_x NOT negated
            mstore(add(ptr, 384), mload(acc))
            mstore(add(ptr, 416), mload(add(acc, 32)))
            mstore(add(ptr, 448), sload(add(vk.slot, 6)))
            mstore(add(ptr, 480), sload(add(vk.slot, 7)))
            mstore(add(ptr, 512), sload(add(vk.slot, 8)))
            mstore(add(ptr, 544), sload(add(vk.slot, 9)))
            // Pair 4: (pi_c, delta2) — C NOT negated (negation moved to pair 1)
            // c → G1(c[0], c[1])
            mstore(add(ptr, 576), calldataload(c))
            mstore(add(ptr, 608), calldataload(add(c, 32)))
            mstore(add(ptr, 640), sload(add(vk.slot, 10)))
            mstore(add(ptr, 672), sload(add(vk.slot, 11)))
            mstore(add(ptr, 704), sload(add(vk.slot, 12)))
            mstore(add(ptr, 736), sload(add(vk.slot, 13)))
            // Call pairing precompile
            success := staticcall(sub(gas(), 2000), 8, ptr, 768, ptr, 32)
            valid := iszero(iszero(mload(ptr)))
        }
        require(success, "pairingCheck failed");
        return valid;
    }

    function g1Add(G1Point memory p1, G1Point memory p2) internal view returns (G1Point memory) {
        bool success;
        G1Point memory out;
        assembly {
            let ptr := mload(0x40)
            mstore(ptr, mload(p1))
            mstore(add(ptr, 32), mload(add(p1, 32)))
            mstore(add(ptr, 64), mload(p2))
            mstore(add(ptr, 96), mload(add(p2, 32)))
            success := staticcall(sub(gas(), 2000), 6, ptr, 128, ptr, 64)
            mstore(out, mload(ptr))
            mstore(add(out, 32), mload(add(ptr, 32)))
        }
        require(success, "ecAdd failed");
        return out;
    }

    function g1Mul(G1Point memory p, uint256 s) internal view returns (G1Point memory) {
        bool success;
        G1Point memory out;
        assembly {
            let ptr := mload(0x40)
            mstore(ptr, mload(p))
            mstore(add(ptr, 32), mload(add(p, 32)))
            mstore(add(ptr, 64), s)
            success := staticcall(sub(gas(), 2000), 7, ptr, 96, ptr, 64)
            mstore(out, mload(ptr))
            mstore(add(out, 32), mload(add(ptr, 32)))
        }
        require(success, "ecMul failed");
        return out;
    }
}
