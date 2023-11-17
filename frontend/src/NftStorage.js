// Import the NFTStorage class and File constructor from the 'nft.storage' package
import { NFTStorage, File } from 'nft.storage';

// The 'mime' npm package helps us set the correct file type on our File objects
import mime from 'mime'
// Paste your NFT.Storage API key into the quotes:

/**
  * Reads an image file from `imagePath` and stores an NFT with the given name and description.
  * @param {string} imagePath the path to an image file
  * @param {string} name a name for the NFT
  * @param {string} description a text description for the NFT
  */
export const storeNFT =  async(image, name, description) => {
    // create a new NFTStorage client using our API key
    const nftstorage = new NFTStorage({ token: process.env.NEXT_PUBLIC_API_KEY })

    // call client.store, passing in the image & metadata
    return nftstorage.store({
        image,
        name,
        description,
    })
}