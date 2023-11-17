'use client';

import React, { useState } from "react";
import AuctionHouse from '../../AuctionHouse.json';
const ethers = require("ethers");

const ManagePage = () => {

  const [message, updateMessage] = useState('Please give us a moment while we verify your role...');
  const [formParams, updateFormParams] = useState({ fee: '', amt: '', address: '' });
  const [adminVisibility, updateAdminVisibility] = useState(false);

  async function disableAllButtons() {
    const arr = ["ca-button", "rm-button", "am-button", "wf-button", "cf-button"];

    arr.forEach(function (butName, _) {
      const button = document.getElementById(butName);
      button.disabled = true;       
      button.style.backgroundColor = "grey";      
      button.style.opacity = 0.3;
    });
  }

  async function enableAllButtons() {
    const arr = ["ca-button", "rm-button", "am-button", "wf-button", "cf-button"];

    arr.forEach(function (butName, _) {
      const button = document.getElementById(butName);
      button.disabled = false;
      button.style.backgroundColor = "blue";
      if (butName == "cf-button") {
        button.style.backgroundColor = "red";
      }      
      button.style.opacity = 1;
    });
  }

  async function changeFee(e) {
    e.preventDefault();
    let newFee = formParams.fee;

    if (!newFee) {
      updateMessage("Please ensure you have entered a valid fee!");
      return;
    }
    newFee = newFee * 10;
    disableAllButtons();
    updateMessage("");
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const AHContract = new ethers.Contract(process.env.NEXT_PUBLIC_AH_CONTRACT, AuctionHouse.abi, signer);
      const tx = await AHContract.setFee(newFee);
      await tx.wait();
    } catch (e) {
      updateMessage("An unknown error occured");
    }

    enableAllButtons();

  }

  async function withdrawFee(e) {
    e.preventDefault();

    const newFee = formParams.amt;

    if (!newFee) {
      updateMessage("Please ensure you have entered a valid fee!");
      return;
    }
    disableAllButtons();
    updateMessage("");
    try {
      const realFee = ethers.parseEther(fee);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const AHContract = new ethers.Contract(process.env.NEXT_PUBLIC_AH_CONTRACT, AuctionHouse.abi, signer);

      const tx = await AHContract.withdrawFees(realFee);
      await tx.wait();
    } catch (e) {
      updateMessage("An unknown error occured");
    }

    enableAllButtons();
  }

  async function addManager(e) {
    e.preventDefault();

    const address = formParams.address;
    if (!address) {
      updateMessage("Please ensure you have entered a valid address!");
      return;
    }
    disableAllButtons();
    updateMessage("");
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const AHContract = new ethers.Contract(process.env.NEXT_PUBLIC_AH_CONTRACT, AuctionHouse.abi, signer);

      const tx = await AHContract.addManager(address);
      await tx.wait();
    } catch (e) {
      updateMessage("An unknown error occured");
    }

    enableAllButtons();

  }

  async function removeManager(e) {
    e.preventDefault();

    const address = formParams.address;
    if (!address) {
      updateMessage("Please ensure you have entered a valid address!");
      return;
    }
    disableAllButtons();
    updateMessage("");
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const AHContract = new ethers.Contract(process.env.NEXT_PUBLIC_AH_CONTRACT, AuctionHouse.abi, signer);

      const tx = await AHContract.removeManager(address);
      await tx.wait();
    } catch (e) {
      updateMessage("An unknown error occured");
    }

    enableAllButtons();
  }

  async function changeAdmin(e) {
    e.preventDefault();

    const address = formParams.address;
    if (!address) {
      updateMessage("Please ensure you have entered a valid address!");
      return;
    }
    disableAllButtons();
    updateMessage("");
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const AHContract = new ethers.Contract(process.env.NEXT_PUBLIC_AH_CONTRACT, AuctionHouse.abi, signer);

      const tx = await AHContract.changeAdmin(address);
      await tx.wait();
    } catch (e) {
      updateMessage("An unknown error occured");
    }

    enableAllButtons();
  }

  React.useEffect(() => {
    const checkManager = async () => {
    
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
  
      const AHContract = new ethers.Contract(process.env.NEXT_PUBLIC_AH_CONTRACT, AuctionHouse.abi, signer);
      const manager = await AHContract.isManager(signer.address);
      const admin = await AHContract.isAdmin(signer.address);
  
      if (!manager && !admin) {
        updateMessage("You are not a manager, please ask the admin to make you a manager or navigate to another page");
        return;
      }
      updateMessage("");
      
      // should add code to hide form again when switching accounts
      if (manager || admin) {
        document.getElementById("action-form").removeAttribute("hidden"); 
      } else {
        if (!document.getElementById("action-form").hasAttribute("hidden")) {
          document.getElementById("action-form").setAttribute("hidden", "hidden");
        }
      }

      if (admin) {
        updateAdminVisibility(true);
      } else {
        updateAdminVisibility(false);
      }
    }
    checkManager();
  }, []);


  return (
    <>
      <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="flex flex-col place-items-center mt-20" id="manager-content">
        <h1 className="text-red-500 text-center">{message}</h1>
        <form className="bg-white shadow-md rounded px-8 pt-4 pb-8 mb-4" hidden id="action-form">
          <div className='flex flex-col place-items-center'>
            <div className="mb-6">
              <label className="block text-blue-500 text-sm font-bold mb-2">Set Fee</label>
              <input 
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              type="number" 
              placeholder="Default 2.5%"
              step="0.1"
              value={formParams.fee} 
              onChange={e => updateFormParams({...formParams, fee: e.target.value})}
              ></input>
              <button className='font-bold mt-1 w-full bg-blue-500 text-white rounded p-2 shadow-lg' id="cf-button" onClick={changeFee}>Confirm Change Fee</button>
            </div>
            <div className='mb-6'>
              <label className="block text-blue-500 text-sm font-bold mb-2">Withdraw Fees</label>
              <input 
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                type="number" 
                placeholder="Min 0.01 AUH"
                step="0.01"
                value={formParams.amt} 
                onChange={e => updateFormParams({...formParams, amt: e.target.value})}
                ></input>
                <button className='font-bold mt-1 w-full bg-blue-500 text-white rounded p-2 shadow-lg' id="wf-button" onClick={withdrawFee}>Confirm Withdrawal</button>
            </div>
          </div>
          <div className={adminVisibility ? 'flex flex-col place-items-center visible' : 'flex flex-col place-items-center invisible'} id="admin-content">
            <div className="mb-6">
              <label className="block text-blue-500 text-sm font-bold mb-2">Add/Remove Manager or Change Admin Address</label>
              <textarea 
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              type="string" 
              placeholder="Enter an address"
              value={formParams.address}
              onChange={e => updateFormParams({...formParams, address: e.target.value})}
              ></textarea>
              <h1 className="text-red-500 text-center">{message}</h1>
              <button className='font-bold mt-1 w-full bg-blue-500 text-white rounded p-2 shadow-lg' id="am-button" onClick={addManager}>Add Manager</button>
              <button className='font-bold mt-1 w-full bg-blue-500 text-white rounded p-2 shadow-lg' id="rm-button" onClick={removeManager}>Remove Manager</button>
              <button className='font-bold mt-1 w-full bg-red-500 text-white rounded p-2 shadow-lg' id="ca-button" onClick={changeAdmin}>Change Admin Address!</button>
            </div>
          </div>
        </form>
      </div>
    </main>
    </>
  );
};

export default ManagePage;