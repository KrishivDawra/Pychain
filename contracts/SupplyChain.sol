// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract SupplyChain is AccessControl {

    bytes32 public constant MANUFACTURER_ROLE = keccak256("MANUFACTURER");
    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR");
    bytes32 public constant RETAILER_ROLE = keccak256("RETAILER");

    struct Product {
        uint256 id;
        string name;
        string metadataHash; // IPFS hash
        address currentOwner;
        bool exists;
    }

    struct Ownership {
        address owner;
        uint256 timestamp;
    }

    uint256 public productCount;

    mapping(uint256 => Product) public products;
    mapping(uint256 => Ownership[]) public productHistory;

    event ProductRegistered(uint256 productId, address manufacturer);
    event OwnershipTransferred(uint256 productId, address from, address to);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MANUFACTURER_ROLE, msg.sender);
    }

    // ✅ Register Product
    function registerProduct(string memory _name, string memory _metadataHash) public onlyRole(MANUFACTURER_ROLE) {
        productCount++;

        products[productCount] = Product({
            id: productCount,
            name: _name,
            metadataHash: _metadataHash,
            currentOwner: msg.sender,
            exists: true
        });

        productHistory[productCount].push(Ownership({
            owner: msg.sender,
            timestamp: block.timestamp
        }));

        emit ProductRegistered(productCount, msg.sender);
    }

    // ✅ Transfer Ownership
    function transferProduct(uint256 _productId, address _to) public {
        require(products[_productId].exists, "Product does not exist");
        require(products[_productId].currentOwner == msg.sender, "Not owner");

        address previousOwner = products[_productId].currentOwner;

        products[_productId].currentOwner = _to;

        productHistory[_productId].push(Ownership({
            owner: _to,
            timestamp: block.timestamp
        }));

        emit OwnershipTransferred(_productId, previousOwner, _to);
    }

    // ✅ Get Product Details
    function getProduct(uint256 _productId) public view returns (
        uint256,
        string memory,
        string memory,
        address
    ) {
        require(products[_productId].exists, "Product does not exist");

        Product memory p = products[_productId];
        return (p.id, p.name, p.metadataHash, p.currentOwner);
    }

    // ✅ Get Ownership History
    function getProductHistory(uint256 _productId) public view returns (Ownership[] memory) {
        return productHistory[_productId];
    }

    // ✅ Fraud Check
    function verifyProduct(uint256 _productId, string memory _metadataHash) public view returns (bool) {
        require(products[_productId].exists, "Product does not exist");

        return keccak256(bytes(products[_productId].metadataHash)) == keccak256(bytes(_metadataHash));
    }
}