import axios from "axios";

export const getIPFSUrlFromNFTStorage = async (uri) => {
    try {
        const half = uri.split("ipfs://")[1];
        const parts = half.split("/");
        
        const metadataLink = `https://${parts[0]}.ipfs.nftstorage.link/metadata.json`;
        const res = await axios.get(metadataLink);
        const ipfsImageLink = res.data.image;

        const linkHalf = ipfsImageLink.split("pfs://")[1];
        const linkParts = linkHalf.split("/");

        const finalLink = `https://${linkParts[0]}.ipfs.nftstorage.link/${linkParts[1]}`;
        return finalLink;
    } catch (e) {
        console.log("You did something bad :)");
    }
};