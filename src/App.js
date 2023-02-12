import { useState } from "react";
import axios from 'axios';
import { NFTStorage } from "nft.storage";

function App() {
  const [prompt, setPrompt] = useState("");
  const [imageBlob, setImageBlob] = useState(null);
  const [file, setFile] = useState(null)



  const generateArt = async () => {
    try {
      const response = await axios.post(`https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5`,
        {
          Headers: {
            Authorization: `Bearer ${process.env.REACT_APP_HUGGING_FACE}}`
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
    } catch (err) {
      console.log(err);
    }
  }

  const uploadArtToIpfs = async () => {
    try {

     
      const nftstorage = new NFTStorage({
        token: process.env.REACT_APP_NFT_STORAGE,
      });
      console.log("OK");
      const store = await nftstorage.store({
        name: "AI NFT",
        description: "AI generated NFT",
        image: file
      })
      console.log(store);
      return cleanupIPFS(store.data.image.href)
    } catch (error) {
      console.log(error);
    }
  }


  const cleanupIPFS = (url) => {
    if(url.includes("ipfs://")) {
      return url.replace("ipfs://", "https://ipfs.io/ipfs/")
    }
  }


  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-4xl font-extrabold">AI Art Gasless mints</h1>
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
            <button
              onClick={uploadArtToIpfs}
              className="bg-black text-white rounded-md p-2"
            >
              Upload to IPFS
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default App;