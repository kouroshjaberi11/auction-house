export const getIPFSUrlFromNFTStorage = (url) => {
    var IPFSUrl = url.split("/");
    const lastIndex = IPFSUrl.length;
    IPFSUrl = "https://ipfs.io/ipfs/"+IPFSUrl[lastIndex-2];
    return IPFSUrl;
};