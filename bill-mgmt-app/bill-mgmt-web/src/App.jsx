// This file has the logic for a bill management user interface that uses React.  
// Server-side APIs are called from a Node.js-based server to return existing billing information.
// The server uses PostgreSQL for persisting data.

// Use the "npm run dev" command to start the web application.  This will use "Vite" and make the user interface available at http://localhost:5173.

// Make sure that "npm run dev" has been issued after changes.  
// If you make a change, then you should see something like this in 
// the terminal: 2:37:40 PM [vite] (client) hmr update /src/App.jsx

// The useState and useEffect hooks from React will be used.
import { useState, useEffect} from "react";
// Use this stylesheet for styling the user interface.
import './App.css';
// Use axios when making API calls.
import axios from "axios";


function App() {

  // Use an array to store bills that are returned from a GET API call.
  // The React useState hook is used with a "bills" constant and a "setBills" function to set the bills list.
  const [bills,setBills]=useState([]);

  // This is used to store a filtered bill list based on the search filter box.
  const [filteredBills,setFilteredBills]=useState([]);

  // This is used for recording the state of a pop-up window that is used for adding new bill details.
  const [isAddModalOpen,setIsAddModalOpen]=useState(false);

  // This is used for recording the state of a pop-up window that is used for paying a bill.
  const [isPayModalOpen,setIsPayModalOpen]=useState(false);

  // This is used for recording the state of a pop-up window that is used for updating details of a bill.
  const [isUpdateModalOpen,setIsUpdateModalOpen]=useState(false);

  // This is used for storing the attributes of a bill.
  // The "datePaid" value is set to 9999-01-01 by default to avoid an undefined or null date value when adding or updating a bill.  The "dueDate" field is required when a user completes the add bill dialog, so the initial value isn't as much a concern.
  const [billData,setBillData]=useState({billfrom:"",billType:"",amountDue:0.0,dueDate:"",isPaid:false,paidInFull:false,amountPaid:0.0,datePaid:"9999-01-01",paidBy:""});

  // This is used for displaying an error message.
  const [errorMsg,setErrorMsg]=useState("");


  // Call the GET API for all bills.  Then for the response, use the response data to populate setBills.
  const getAllBills=()=>{
    axios.get("http://localhost:3007/bills").then((res)=>{
      setBills(res.data);
      // Since the filtered table will be displayed, set the filtered data initially to everything in case a filter hasn't been entered.
      setFilteredBills(res.data);
    });
  };

  // Use this to call getAllBills and pass it a dependency array.
  // Any value change in the initially empty array of bills will cause the getAllBills function to run.
  useEffect(()=>{
    getAllBills();
  },[]);
 

  // This is used for the box where you can search for bills.
  // Pass in an event named 'e'.
  const handleSearch=(e)=>{
    // Store what was entered in the text field in a constant.
    const searchValue=e.target.value.toLowerCase();

    // Filter on the lower case billfrom, billType, amountDue, dueDate, isPaid, paidInFull, amountPaid, datePaid, and paidBy parameters.
    // The parameters that are not strings have to have toString() called first to convert them to string representations.
    const filteredData=bills.filter(bill=>bill.billfrom.toLowerCase().includes(searchValue) || 
    bill.billType.toLowerCase().includes(searchValue) ||
    bill.amountDue.toString().toLowerCase().includes(searchValue) ||
    bill.dueDate.toLowerCase().includes(searchValue) ||
    bill.isPaid.toString().toLowerCase().includes(searchValue) ||
    bill.paidInFull.toString().toLowerCase().includes(searchValue) ||
    bill.amountPaid.toString().toLowerCase().includes(searchValue) ||
    bill.datePaid.toString().toLowerCase().includes(searchValue) ||
    bill.paidBy.toLowerCase().includes(searchValue));
  
    // Populate a list of bills based on the filtering.
    setFilteredBills(filteredData);
  };

  // This is used for updating the stored state values of parameters after input fields change.
  const handleChange=(e)=>{
    // Set the value with e.target.value
    // The "..." is spread syntax which allows the billData object to be deconstructed into unique variables.
    setBillData({...billData,[e.target.name]:e.target.value});
  };


  // **** ADD - Functions related to the modal for adding a new bill ****
  // This is for opening the pop-up window that is used for adding a new bill.
  const openPopup=()=>{
    setIsAddModalOpen(true);
  };

  // This is for the Add Bill button that is used to add a new bill.
  // Call the POST API to add a new entry.
  const handleSubmit=async (e)=>{

    // Prevent the default event action from happening.
    e.preventDefault();

    // Display an error message if initial input fields (other than isPaid, paidInFull, amountPaid, datePaid, and paidBy) are not completed.
    let errMsg="";
    if (!billData.billfrom || !billData.billType || !billData.amountDue || !billData.dueDate) {
      errMsg="The Bill From, Bill Type, Amount Due, and Due Date fields are required at the time of bill entry!";
      setErrorMsg(errMsg);
    } 
    
    // If there isn't an error and a billid doesn't already exist, then create a new persistent bill item.
    if ((errMsg.length==0) && !billData.billid) {
      // Create a new entry since a billid doesn't already exist.
      await axios.post("http://localhost:3007/addbill",billData).then((res)=>{
      console.log(res.data);  
      });
    }
    
    if ((errMsg.length==0)) {
    // Make sure the pop-up window is closed upon successfully adding a bill.
    // The pop-up won't be closed if there is an error so that it is possible to view the error.
      handleClose();
    }
  };

  // This is for closing the pop-up window that is used for adding a new bill.
  const handleClose=()=>{
    // Mark the pop-up window closed.
    setIsAddModalOpen(false);
    // Call getAllBills so that it will show a bill that was just added.
    getAllBills();
    // Clear the bill input fields when closing.  This also has the effect of removing any error message.
    setBillData({billfrom:"",billType:"",amountDue:0.0,dueDate:"",isPaid:false,paidInFull:false,amountPaid:0.0,datePaid:"9999-01-01",paidBy:""});
    // Set the error message to be empty to remove it.
    setErrorMsg("");
  };


  // **** PAY - Functions related to the modal for paying a bill ****
  // This is for opening the pop-up window that is used for paying a bill.
  const openPayPopup=()=>{
    setIsPayModalOpen(true);
  };

  // Handle paying a bill.
  // Pass in the bill object.
  const handleUpdate=(bill)=>{
    // Set the bill data to display to the contents of the bill object that was passed in.
    setBillData(bill);
    // Open the popup window.
    openPayPopup();  
  };

  // Handle what happens after clicking the submit button when paying a bill.
  const handlePaySubmit=async (e)=>{

    // Prevent the default event action from happening.
    e.preventDefault();

    // Display an error message if the threee fields that are specific to paying a bill are not completed.
    let errMsg="";
    if (!billData.amountPaid || !billData.datePaid || !billData.paidBy) {
      errMsg="The Amount Paid, Date Paid, and Paid By fields are required when paying a bill!";
      setErrorMsg(errMsg);
    }

    // Make sure there isn't an error of incomplete input before either adding or updating an entry.
    if (errMsg.length==0) {
      // Mark the bill paid.
      // Note the use of backticks here since a substituted value is being passed.
      await axios.patch(`http://localhost:3007/paybill/${billData.billid}`,billData).then((res)=>{
      console.log(res.data);
      });

      // Make sure the pop-up window for paying is closed when adding payment information is successful.
      // The pop-up won't be closed if there is an error so that it is possible to view the error.
        handlePayClose();
    }
  };

  // This is for closing the pop-up window that is used for paying a bill.
  const handlePayClose=()=>{
    // Mark the pop-up window closed.
    setIsPayModalOpen(false);
    // Call getAllBills so that it will show a bill that was just added.
    getAllBills();
    // Clear the bill input fields when closing.  This also has the effect of removing any error message.
    setBillData({billfrom:"",billType:"",amountDue:0.0,dueDate:"",isPaid:false,paidInFull:false,amountPaid:0.0,datePaid:"9999-01-01",paidBy:""});
    // Set the error message to be empty to remove it.
    setErrorMsg("");
  };


  // **** UPDATE - Functions related to the modal for updating bill details (both for unpaid and paid bills) ****
  // This is for opening the pop-up window that is used for updating a bill.
  const openUpdatePopup=()=>{
    setIsUpdateModalOpen(true);
  };

  // Handle updating a bill.
  // Pass in the bill object.
  const handleFieldUpdates=(bill)=>{
    // Set the bill data to display to the contents of the bill object that was passed in.
    setBillData(bill);
    // Open the popup window.
    openUpdatePopup();  
  };

  // Handle what happens after clicking the submit button when updating a bill.
  const handleUpdateSubmit=async (e)=>{

    // Prevent the default event action from happening.
    e.preventDefault();

    // Display an error message if at least the four initial input fields for a bill are not completed.
    let errMsg="";
    if (!billData.billfrom || !billData.billType || !billData.amountDue || !billData.dueDate) {
      errMsg="The Bill From, Bill Type, Amount Due, and Due Date fields are required when updating a bill entry!";
      setErrorMsg(errMsg);
    }

    // Make sure there isn't an error of incomplete input before either adding or updating an entry.
    if (errMsg.length==0) {
      // Update the bill data.
      // Note the use of backticks here since a substituted value is being passed.
      await axios.patch(`http://localhost:3007/updatebill/${billData.billid}`,billData).then((res)=>{
      console.log(res.data);
      });

      // Make sure the pop-up window for paying is closed when adding payment information is successful.
      // The pop-up won't be closed if there is an error so that it is possible to view the error.
      handleUpdateClose();
    }
  };

  // This is for closing the pop-up window that is used for updating a bill.
  const handleUpdateClose=()=>{
    // Mark the pop-up window closed.
    setIsUpdateModalOpen(false);
    // Call getAllBills so that it will show a bill that was just added.
    getAllBills();
    // Clear the bill input fields when closing.  This also has the effect of removing any error message.
    setBillData({billfrom:"",billType:"",amountDue:0.0,dueDate:"",isPaid:false,paidInFull:false,amountPaid:0.0,datePaid:"9999-01-01",paidBy:""});
    // Set the error message to be empty to remove it.
    setErrorMsg("");
  };

  
  // **** DELETE - Handle deleting a bill item
  // Display a message first asking for confirmation that the user really wants to delete a particular bill,.
  const handleDelete=async(billId)=>{
    // Display a confirmation pop-up asking for confirmation.
    const isConfirmed=window.confirm("Are you sure you want to delete this bill?");

    if (isConfirmed) {
      await axios.delete(`http://localhost:3007/bills/${billId}`).then((res)=>{
        // Refresh the bill list after the deletion.
        setBills(res.data);
        // Set the filtered bill list to the complete list at this point.
        setFilteredBills(res.data);
        console.log(res.data);
      });
    }
    // Reload the window to prevent a blank screen after deletion.
    window.location.reload();
  };
  
  
  // Return the HTML to display based on state information determined dynamically based on JavaScript functions noted within {}.
  // Three different pop-up "div" sections will be displayed, depending on the operation to perform (adding new bill information, paying a bill, or updating details of an unpaid or paid bill).
  return (
    <>
    <div className='std-container'>
      <h3>Bill Management Application <br></br>(Uses React JS, Node.js, and PostgreSQL)</h3>
      <div className='search-box'>
        <input className='search-input' onChange={handleSearch} type="search" name="searchinput" id="searchinput" placeholder='Search for a bill here'></input>
        <button className='addNewBillBtn addPayUpdateColor' onClick={openPopup}>Add new bill</button>
      </div>
      <div className='table-box'>
        {/* This is a "div" block to display fields where values can be entered for a new bill.
        This content will be rendered if "isAddModalOpen" is true. */}
        {isAddModalOpen && <div className='addbillpopup'>
              <span className='closeBtn' onClick={handleClose}>&times;</span>
              <h4>Enter Bill Details</h4>
              {errorMsg && <p className='error'>{errorMsg}</p>}
              <div className='popupdiv'>
                <label className='popuplabel' htmlFor="billfrom">Bill From</label>
                <input className='popupinput' value={billData.billfrom} onChange={handleChange} type="text" name="billfrom" id="billfrom"/>
              </div>
              <div className='popupdiv'>
                <label className='popuplabel' htmlFor="billType">Bill Type</label> <br></br>
                <select className='popupinput' value={billData.billType} onChange={handleChange} name="billType" id="billType">
                  {/* Make the first option an instruction to force a change from the first value in the list to another value. */}
                  <option value="OptionSelection">Please choose a bill type</option>
                  <option value="Utility">Utility</option>
                  <option value="Medical">Medical</option>
                  <option value="Insurance">Insurance</option>
                  <option value="Tax">Tax</option>
                  <option value="Home">Home</option>
                  <option value="Auto">Auto</option>
                </select>
              </div>
              <div className='popupdiv'>
                <label className='popuplabel' htmlFor="amountDue">Amount Due</label>
                <input className='popupinput' value={billData.amountDue} onChange={handleChange} type="number" step="0.01" min="0.0" max="100000.00" name="amountDue" id="amountDue"/>
              </div>
              <div className='popupdiv'>
                <label className='popuplabel' htmlFor="dueDate">Due Date</label> <br></br>
                <input className='popupinput' value={billData.dueDate} min="2025-01-01" max="2030-12-31" onChange={handleChange} type="date" name="dueDate" id="dueDate"/>
              </div>
              <br></br>
              <button className='addPayUpdateBtn addPayUpdateColor'onClick={handleSubmit}>Add Bill</button>
          </div>}
          {/* This is a "div" block to display fields where values are entered when paying a bill.
          This content will be rendered if "isPayModalOpen" is true.
          Clicking the "Pay" button in a row for an existing bill will call the "handleUpdate" function to set bill data and then open the payment popup. */}
          {isPayModalOpen && <div className='paypopup'>
              <span className='closeBtn' onClick={handlePayClose}>&times;</span>
              {errorMsg && <p className='error'>{errorMsg}</p>}
              <h4>Enter Bill Payment Information</h4>
              <div className='popupdiv'>
                <label className='popuplabel' htmlFor="billfrom">Bill From</label>
                <input className='popupinput' value={billData.billfrom} onChange={handleChange} type="text" name="billfrom" id="billfrom" readOnly/>
              </div>
              <div className='popupdiv'>
                <label className='popuplabel' htmlFor="billType">Bill Type</label> <br></br>
                <input className='popupinput' value={billData.billType} onChange={handleChange} type="text" name="billType" id="billType" readOnly/>
              </div>
              <div className='popupdiv'>
                <label className='popuplabel' htmlFor="amountDue">Amount Due</label>
                <input className='popupinput' value={billData.amountDue} onChange={handleChange} type="number" step="0.01" min="0.0" max="100000.00" name="amountDue" id="amountDue" readOnly/>
              </div>
              <div className='popupdiv'>
                <label className='popuplabel' htmlFor="dueDate">Due Date</label> <br></br>
                <input className='popupinput' value={billData.dueDate} min="2025-01-01" max="2030-12-31" onChange={handleChange} type="date" name="dueDate" id="dueDate" readOnly/>
              </div>
              <div className='popupdiv'>
                <label className='popuplabel' htmlFor="isPaid">Payment Made?</label> <br></br>
                <input className='popupinput' value={billData.isPaid} onChange={handleChange} type="text" name="isPaid" id="isPaid" readOnly/>
              </div>
              <div className='popupdiv'>
                <label className='popuplabel' htmlFor="paidInFull">Paid In Full?</label> <br></br>
                <input className='popupinput' value={billData.paidInFull} onChange={handleChange} type="text" name="paidInFull" id="paidInFull" readOnly/>
              </div>
              <div className='popupdiv'>
                <label className='popuplabel' htmlFor="amountPaid">Amount Paid</label> <br></br>
                <input className='popupinput' value={billData.amountPaid} onChange={handleChange} type="number" step="0.01" min="0.0" max="100000.00" name="amountPaid" id="amountPaid"/>
              </div>
              <div className='popupdiv'>
                <label className='popuplabel' htmlFor="datePaid">Date Paid</label> <br></br>
                <input className='popupinput' value={billData.datePaid} min="2025-01-01" max="2030-12-31" onChange={handleChange} type="date" name="datePaid" id="datePaid"/>
              </div>
              <div className='popupdiv'>
                <label className='popuplabel' htmlFor="paidBy">Paid By</label> <br></br>
                <select className='popupinput' value={billData.paidBy} onChange={handleChange} name="paidBy" id="paidBy">
                  {/* Make the first option an instruction to force a change from the first value in the list to another value. */}
                  <option value="OptionSelection">Please choose a payment type</option>
                  <option value="Checking">Checking</option>
                  <option value="Visa">Visa</option>
                  <option value="MasterCard">MasterCard</option>
                  <option value="Gift card">Gift Card</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>
              <br></br>
              <button className='addPayUpdateBtn addPayUpdateColor'onClick={handlePaySubmit}>Pay Bill</button>
          </div>}
          {/* This is a "div" block to display fields where values are updated for an existing bill.
          All fields are editable, including initial bill information and payment information.
          This content will be rendered if "isUpdateModalOpen" is true.
          Clicking the "Update" button in a row for an existing bill will call the "handleFieldUpdates" function to set bill data and then open the update popup. */}
          {isUpdateModalOpen && <div className='updatebillpopup'>
              <span className='closeBtn' onClick={handleUpdateClose}>&times;</span>
              <h4>Bill Details</h4>
              {errorMsg && <p className='error'>{errorMsg}</p>}
              <div className='popupdiv'>
                <label className='popuplabel' htmlFor="billfrom">Bill From</label>
                <input className='popupinput' value={billData.billfrom} onChange={handleChange} type="text" name="billfrom" id="billfrom"/>
              </div>
              <div className='popupdiv'>
                <label className='popuplabel' htmlFor="billType">Bill Type</label> <br></br>
                <select className='popupinput' value={billData.billType} onChange={handleChange} name="billType" id="billType">
                  {/* Make the first option an instruction to force a change from the first value in the list to another value. */}
                  <option value="OptionSelection">Please choose a bill type</option>
                  <option value="Utility">Utility</option>
                  <option value="Medical">Medical</option>
                  <option value="Insurance">Insurance</option>
                  <option value="Tax">Tax</option>
                  <option value="Home">Home</option>
                  <option value="Auto">Auto</option>
                </select>
              </div>
              <div className='popupdiv'>
                <label className='popuplabel' htmlFor="amountDue">Amount Due</label>
                <input className='popupinput' value={billData.amountDue} onChange={handleChange} type="number" step="0.01" min="0.0" max="100000.00" name="amountDue" id="amountDue"/>
              </div>
              <div className='popupdiv'>
                <label className='popuplabel' htmlFor="dueDate">Due Date</label> <br></br>
                <input className='popupinput' value={billData.dueDate} min="2025-01-01" max="2030-12-31" onChange={handleChange} type="date" name="dueDate" id="dueDate"/>
              </div>
              <div className='popupdiv'>
                <label className='popuplabel' htmlFor="isPaid">Payment Made?</label> <br></br>
                <input className='popupinput' value={billData.isPaid} onChange={handleChange} type="text" name="isPaid" id="isPaid" readOnly/>
              </div>
              <div className='popupdiv'>
                <label className='popuplabel' htmlFor="paidInFull">Paid In Full?</label> <br></br>
                <input className='popupinput' value={billData.paidInFull} onChange={handleChange} type="text" name="paidInFull" id="paidInFull" readOnly/>
              </div>
              <div className='popupdiv'>
                <label className='popuplabel' htmlFor="amountPaid">Amount Paid</label> <br></br>
                <input className='popupinput' value={billData.amountPaid} onChange={handleChange} type="number" step="0.01" min="0.0" max="100000.00" name="amountPaid" id="amountPaid"/>
              </div>
              <div className='popupdiv'>
                <label className='popuplabel' htmlFor="datePaid">Date Paid</label> <br></br>
                <input className='popupinput' value={billData.datePaid} min="2025-01-01" max="2030-12-31" onChange={handleChange} type="date" name="datePaid" id="datePaid"/>
              </div>
              <div className='popupdiv'>
                <label className='popuplabel' htmlFor="paidBy">Paid By</label> <br></br>
                <select className='popupinput' value={billData.paidBy} onChange={handleChange} name="paidBy" id="paidBy">
                  {/* Make the first option an instruction to force a change from the first value in the list to another value. */}
                  <option value="OptionSelection">Please choose a payment type</option>
                  <option value="Checking">Checking</option>
                  <option value="Visa">Visa</option>
                  <option value="MasterCard">MasterCard</option>
                  <option value="Gift card">Gift Card</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>
              <br></br>
              <button className='addPayUpdateBtn addPayUpdateColor'onClick={handleUpdateSubmit}>Update Bill</button>
          </div>}
        {/* Display the table that lists all bills. */}
        <table className='table'>
          <tbody>
            <tr>
            <th>BillId</th>
            <th>Bill From</th>
            <th>Bill Type</th>
            <th>Amount Due</th>
            <th>Due Date</th>
            <th>Payment Made?</th>
            <th>Paid In Full?</th>
            <th>Amount Paid</th>
            <th>Date Paid</th>
            <th>Paid By</th>
            <th>Pay</th>
            <th>Update</th>
            <th>Delete</th>
            </tr>
            {/* If there is filtering set based on the search box, then make sure the table is populated with the filtered list of bills. */}
            {filteredBills && filteredBills.map(bill=>{
              return (<tr key={bill.billid}>
                <td>{bill.billid}</td>
                <td>{bill.billfrom}</td>
                <td>{bill.billType}</td>
                <td>{bill.amountDue}</td>
                <td>{bill.dueDate}</td>
                <td>{bill.isPaid.toString()}</td>
                <td>{bill.paidInFull.toString()}</td>
                <td>{bill.amountPaid}</td>
                <td>{bill.datePaid}</td>
                <td>{bill.paidBy}</td>
                {/* Disable the "Pay" button if the bill is already paid in full. */}
                <td><button className='payUpdateBtns addPayUpdateColor' onClick={()=>handleUpdate(bill)} disabled={bill.paidInFull}>Pay</button></td>
                <td><button className='payUpdateBtns addPayUpdateColor' onClick={()=>handleFieldUpdates(bill)}>Update</button></td>
                <td><button className='deleteBtn deletecolor'onClick={()=>handleDelete(bill.billid)}>Delete</button></td>
              </tr>)
            })}  
          </tbody>
        </table> 
      </div>
    </div>   
    </>
  )
}

// Make the App function available from other files.
export default App;
