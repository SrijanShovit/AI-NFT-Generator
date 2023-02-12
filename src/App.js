import { useState } from "react";
import axios from 'axios';
import toast from 'react-hot-toast';
import { NFTStorage } from "nft.storage";
const REACT_APP_NFT_STORAGE="";
const REACT_APP_NFT_PORT="";

function App() {
  const [prompt, setPrompt] = useState("");
  const [imageBlob, setImageBlob] = useState(null);
  const [file, setFile] = useState(null);
  const [nftName,setNftName] = useState("");
  const [nftDescription,setNftDescription] = useState("");
  const [addressToMint,setAddressToMint] = useState("0xf2E841bb430B45BC6AC3EA5e24EEee039877E3FA");




  const generateArt = async () => {
    const notification = toast.loading("Generating Art!!");
    try {
      const response = await axios.post(`https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5`,
        {
          Headers: {
            Authorization: `Bearer ${process.env.REACT_APP_HUGGING_FACE}`,
        },
          method: "POST",
          inputs: prompt,
        },
        {
          responseType: "blob"
        }
      );

      const url = URL.createObjectURL(response.data);
      console.log(url);
      setImageBlob(url);
      //convert to file
      const fileFromBlob = new File([response.data],
        "image.png", {
        type: "image/png",
      });
      setFile(fileFromBlob);
      toast.success(`Successfully created art`,{
        id:notification
    });

    } catch (err) {
      console.log(err);
      toast.error("Model could not be loaded! Please try later",{
        id:notification 
    });
    }
  }

  const uploadArtToIpfs = async () => {
    const notification = toast.loading("Uploading to IPFS");
    try {     
      const nftstorage = new NFTStorage({
        token: REACT_APP_NFT_STORAGE,
      });
      console.log("OK");
      const store = await nftstorage.store({
        name: "AI NFT",
        description: "AI generated NFT",
        image: file,
       
      });
      console.log(store);
      toast.success(`Successfully uploaded to IPFS`,{
        id:notification
    });
      return cleanupIPFS(store.data.image.href);
    } catch (error) {
      console.log(error);
      toast.error("Upload to IPFS failed",{
        id:notification 
    });
    }
  }


  const cleanupIPFS = (url) => {
    if(url.includes("ipfs://")) {
      return url.replace("ipfs://", "https://ipfs.io/ipfs/")
    }
  }


  const mintNFT = async () => {
    const notification = toast.loading("Minting NFT");

    try {
      const imageURL = await uploadArtToIpfs();
      console.log(",,,,,",imageURL)
      //mint as an NFT on nftport
      console.log(nftName,nftDescription,addressToMint);
      console.log(REACT_APP_NFT_PORT);
      const response = await axios.post(
        `https://api.nftport.xyz/v0/mints/easy/urls`,
        {
          file_url: imageURL,
          chain: "polygon",
          name: nftName,
          description: nftDescription,
          mint_to_address: addressToMint,
        },
        {
          headers:{
            Authorization: REACT_APP_NFT_PORT,
          }
        }
      );
      const data = await response.data;
      console.log(data);
      toast.success(`Successfully minted`,{
        id:notification
    });

    } catch (err) {
      console.log(err);
      toast.error("Could not mint",{
        id:notification 
    });
    
    
    }
  }


  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-4xl font-extrabold text-sky-500">AI Art Gasless Minting App</h1>
      <div className="flex flex-col items-center justify-center">

        <div className="flex items-center justify-center gap-4">
          <input
            className="border-2 border-black rounded-md p-2"
            onChange={(e) => setPrompt(e.target.value)}
            type="text"
            placeholder="Enter a prompt"
          />
          <button className="bg-black text-white rounded-md p-2"
            onClick={generateArt}
          >Generate</button>
        </div>
        {imageBlob && (
          <div className="flex flex-col gap-4 p-4 items-center justify-center">
            <img src={imageBlob} alt="AI generated art" />
            <div className="flex items-center justify-center gap-4">
          <input
            className="border-2 border-black rounded-md p-2"
            onChange={(e) => setNftName(e.target.value)}
            type="text"
            placeholder="Enter an NFT Name"
          />
          <input
            className="border-2 border-black rounded-md p-2"
            onChange={(e) => setNftDescription(e.target.value)}
            type="text"
            placeholder="Enter a description for your NFT"
          />
          <input
            className="border-2 border-black rounded-md p-2"
            onChange={(e) => setAddressToMint(e.target.value)}
            type="text"
            placeholder="Enter an address to mint"
          />
          
        </div>
            <button
              onClick={mintNFT}
              className="bg-black text-white rounded-md p-2"
            >
              Mint NFT
            </button>
          </div>
        )}

       
      </div>
    </div>
  )
}

export default App;