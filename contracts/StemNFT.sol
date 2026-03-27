// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract StemNFT is ERC721 {

    enum LicenseType {
        Personal,
        Commercial
    }

    struct Stem {
        address     producer;
        string      title;
        uint256     personalPrice;
        uint256     commercialPrice;
        uint8       royaltyRate;
    }

    struct License {
        uint256     stemId;
        address     buyer;
        LicenseType licenseType;
        uint256     purchasedAt;
    }

    struct Song {
        address   artist;
        string    title;
        uint256[] stemIds;
    }

    mapping(uint256 => Stem)    public stems;
    mapping(uint256 => License) public licenses;
    mapping(uint256 => Song)    public songs;

    uint256 public stemCount;
    uint256 public licenseCount;
    uint256 public songCount;

    mapping(uint256 => mapping(address => bool)) public hasLicense;

    event StemUploaded(uint256 indexed id, address indexed producer, string title);
    event LicensePurchased(
        uint256 indexed licenseId,
        uint256 indexed stemId,
        address indexed buyer,
        LicenseType licenseType,
        uint256 pricePaid
    );
    event SongRegistered(uint256 indexed songId, address indexed artist, string title);
    event RevenueDistributed(uint256 indexed songId, uint256 totalAmount);

    constructor() ERC721("BeatExchange", "BEAT") {}

    function uploadStem(
        string memory title,
        uint256 personalPrice,
        uint256 commercialPrice,
        uint8 royaltyRate
    ) external {
        require(bytes(title).length > 0,         "Title cannot be empty");
        require(bytes(title).length <= 100,       "Title too long");
        require(personalPrice > 0,                "Personal price must be > 0");
        require(commercialPrice > personalPrice,  "Commercial price must be higher");
        require(royaltyRate <= 50,                "Royalty rate too high");

        stems[stemCount] = Stem({
            producer:        msg.sender,
            title:           title,
            personalPrice:   personalPrice,
            commercialPrice: commercialPrice,
            royaltyRate:     royaltyRate
        });

        _safeMint(msg.sender, stemCount);
        emit StemUploaded(stemCount, msg.sender, title);
        stemCount++;
    }

    function getStem(uint256 id) external view returns (Stem memory) {
        require(id < stemCount, "Stem does not exist");
        return stems[id];
    }

    function buyStem(uint256 id, LicenseType licenseType) external payable {
        require(id < stemCount,              "Stem does not exist");
        require(!hasLicense[id][msg.sender], "Already have a license");

        Stem memory stem = stems[id];

        require(msg.sender != stem.producer, "Producer cannot buy own stem");

        uint256 requiredPrice = licenseType == LicenseType.Personal
            ? stem.personalPrice
            : stem.commercialPrice;

        require(msg.value >= requiredPrice,  "Not enough ETH sent");

        (bool success, ) = payable(stem.producer).call{value: msg.value}("");
        require(success, "Payment failed");

        licenses[licenseCount] = License({
            stemId:      id,
            buyer:       msg.sender,
            licenseType: licenseType,
            purchasedAt: block.timestamp
        });

        hasLicense[id][msg.sender] = true;
        licenseCount++;

        emit LicensePurchased(licenseCount - 1, id, msg.sender, licenseType, msg.value);
    }

    function getLicense(uint256 stemId, address buyer)
        external view returns (License memory)
    {
        require(hasLicense[stemId][buyer], "No license found");

        for (uint256 i = 0; i < licenseCount; i++) {
            if (licenses[i].stemId == stemId && licenses[i].buyer == buyer) {
                return licenses[i];
            }
        }
        revert("License not found");
    }

    function registerSong(string memory title, uint256[] memory stemIds) external {
        require(bytes(title).length > 0, "Title cannot be empty");
        require(stemIds.length > 0,      "Must use at least one stem");
        require(stemIds.length <= 10,    "Too many stems");

        for (uint256 i = 0; i < stemIds.length; i++) {
            require(
                hasLicense[stemIds[i]][msg.sender],
                "Missing license for stem"
            );
        }

        songs[songCount] = Song({
            artist:  msg.sender,
            title:   title,
            stemIds: stemIds
        });

        emit SongRegistered(songCount, msg.sender, title);
        songCount++;
    }

    function distributeRevenue(uint256 songId) external payable {
        require(songId < songCount,        "Song does not exist");
        require(msg.value > 0,             "No ETH sent");

        Song memory song = songs[songId];
        require(msg.sender == song.artist, "Only artist can distribute revenue");

        uint256 totalRoyaltiesPaid = 0;
        uint256 numStems = song.stemIds.length;

        for (uint256 i = 0; i < numStems; i++) {
            Stem memory stem = stems[song.stemIds[i]];

            uint256 stemShare = (msg.value * stem.royaltyRate) / (100 * numStems);

            if (stemShare > 0) {
                (bool success, ) = payable(stem.producer).call{value: stemShare}("");
                require(success, "Royalty payment failed");
                totalRoyaltiesPaid += stemShare;
            }
        }

        uint256 artistShare = msg.value - totalRoyaltiesPaid;
        if (artistShare > 0) {
            (bool success, ) = payable(song.artist).call{value: artistShare}("");
            require(success, "Artist payment failed");
        }

        emit RevenueDistributed(songId, msg.value);
    }
}