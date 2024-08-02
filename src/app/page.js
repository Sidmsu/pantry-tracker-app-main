'use client';

import { useState, useEffect } from 'react';
import { 
  Box, 
  Stack, 
  Typography, 
  Button, 
  Modal, 
  TextField, 
  Container, 
  Paper, 
  MenuItem 
} from '@mui/material';
import { firestore, auth } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  deleteDoc,
  getDoc,
  startAfter,
  limit
} from 'firebase/firestore';
import { parse } from 'json2csv';
import jsPDF from 'jspdf';

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
};

export default function Home() {
  const [user] = useAuthState(auth);
  const [inventory, setInventory] = useState([]);
  const [open, setOpen] = useState(false);
  const [itemName, setItemName] = useState('');
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemCategory, setItemCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [lastDoc, setLastDoc] = useState(null);

  const updateInventory = async (loadMore = false) => {
    try {
      let q = query(collection(firestore, 'inventory'), limit(10));
      if (loadMore && lastDoc) {
        q = query(collection(firestore, 'inventory'), startAfter(lastDoc), limit(10));
      }
      const snapshot = await getDocs(q);
      const inventoryList = snapshot.docs.map(doc => ({ name: doc.id, ...doc.data() }));
      if (loadMore) {
        setInventory(prev => [...prev, ...inventoryList]);
      } else {
        setInventory(inventoryList);
      }
      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
    } catch (error) {
      console.error("Error fetching inventory: ", error);
    }
  };

  useEffect(() => {
    updateInventory();
  }, []);

  const addItem = async (item, quantity, category) => {
    try {
      const docRef = doc(collection(firestore, 'inventory'), item);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const existingQuantity = docSnap.data().quantity;
        await setDoc(docRef, { quantity: existingQuantity + quantity, category });
      } else {
        await setDoc(docRef, { quantity, category });
      }
      console.log(`Item ${item} added/updated successfully`);
      await updateInventory();
    } catch (error) {
      console.error("Error adding item: ", error);
    }
  };

  const removeItem = async (item) => {
    try {
      const docRef = doc(collection(firestore, 'inventory'), item);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const { quantity } = docSnap.data();
        if (quantity === 1) {
          await deleteDoc(docRef);
        } else {
          await setDoc(docRef, { quantity: quantity - 1 });
        }
      }
      console.log(`Item ${item} removed/decreased successfully`);
      await updateInventory();
    } catch (error) {
      console.error("Error removing item: ", error);
    }
  };

  const deleteItem = async (item) => {
    try {
      const docRef = doc(collection(firestore, 'inventory'), item);
      await deleteDoc(docRef);
      console.log(`Item ${item} deleted successfully`);
      await updateInventory();
    } catch (error) {
      console.error("Error deleting item: ", error);
    }
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setItemName('');
    setItemQuantity(1);
    setItemCategory('');
  };

  const exportToCSV = () => {
    const csv = parse(inventory);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'inventory.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    inventory.forEach((item, i) => {
      doc.text(20, 10 + i * 10, `${item.name}: ${item.quantity}`);
    });
    doc.save('inventory.pdf');
  };

  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (selectedCategory === '' || item.category === selectedCategory)
  );

  return (
    <Container maxWidth="md">
      <Box my={4}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
          Pantry Tracker
        </Typography>
        
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField 
              fullWidth 
              label="Search Items" 
              variant="outlined" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <TextField
              select
              label="Filter by Category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              variant="outlined"
              fullWidth
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="Electronics">Electronics</MenuItem>
              <MenuItem value="Furniture">Furniture</MenuItem>
              <MenuItem value="Groceries">Groceries</MenuItem>
              <MenuItem value="Clothing">Clothing</MenuItem>
            </TextField>
            <Button variant="contained" onClick={() => setSearchTerm('')}>
              Clear
            </Button>
          </Stack>
        </Paper>

        <Paper elevation={3}>
          <Box p={3} bgcolor="primary.dark" textAlign={'center'}>
            <Typography variant="h4" color="primary.contrastText">
              Inventory Items
            </Typography>
          </Box>
          <Stack spacing={2} sx={{ maxHeight: 400, overflow: 'auto', p: 2 }}>
            {filteredInventory.map(({name, quantity}) => (
              <Paper key={name} elevation={2}>
                <Box
                  p={2}
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography variant="h6">
                    {name.charAt(0).toUpperCase() + name.slice(1)}
                  </Typography>
                  <Typography variant="subtitle1">
                    Quantity: {quantity}
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Button variant="outlined" color="primary" onClick={() => addItem(name, 1, itemCategory)}>
                      Add
                    </Button>
                    <Button variant="outlined" color="secondary" onClick={() => removeItem(name)}>
                      Remove
                    </Button>
                    <Button variant="contained" color="error" onClick={() => deleteItem(name)}>
                      Delete
                    </Button>
                  </Stack>
                </Box>
              </Paper>
            ))}
          </Stack>
        </Paper>

        <Box mt={3} display="flex" justifyContent="center">
          <Button variant="contained" color="primary" onClick={handleOpen} size="large">
            Add New Item
          </Button>
          <Button variant="contained" onClick={exportToCSV} sx={{ ml: 2 }}>
            Export to CSV
          </Button>
          <Button variant="contained" onClick={exportToPDF} sx={{ ml: 2 }}>
            Export to PDF
          </Button>
        </Box>
      </Box>

      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="add-item-modal"
      >
        <Box sx={modalStyle}>
          <Typography id="add-item-modal" variant="h6" component="h2" gutterBottom>
            Add New Item
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Item Name"
            fullWidth
            variant="outlined"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Quantity"
            fullWidth
            type="number"
            variant="outlined"
            value={itemQuantity}
            onChange={(e) => setItemQuantity(Number(e.target.value))}
          />
          <TextField
            select
            label="Category"
            value={itemCategory}
            onChange={(e) => setItemCategory(e.target.value)}
            variant="outlined"
            fullWidth
          >
            <MenuItem value="Electronics">Electronics</MenuItem>
            <MenuItem value="Furniture">Furniture</MenuItem>
            <MenuItem value="Groceries">Groceries</MenuItem>
            <MenuItem value="Clothing">Clothing</MenuItem>
          </TextField>
          <Box mt={3} display="flex" justifyContent="flex-end">
            <Button onClick={handleClose} color="primary">
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (itemName.trim() && itemQuantity > 0) {
                  addItem(itemName.trim(), itemQuantity, itemCategory);
                  handleClose();
                }
              }}
              color="primary"
              variant="contained"
              sx={{ ml: 2 }}
            >
              Add
            </Button>
          </Box>
        </Box>
      </Modal>
    </Container>
  );
}
