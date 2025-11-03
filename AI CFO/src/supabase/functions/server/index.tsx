import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as XLSX from "npm:xlsx@0.18.5";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization", "X-Session-Token"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-b3b8d743/health", (c) => {
  return c.json({ status: "ok" });
});

// Login
app.post("/make-server-b3b8d743/auth/login", async (c) => {
  try {
    console.log('════════════════════════════════════════');
    console.log('🔐 LOGIN REQUEST RECEIVED');
    console.log('════════════════════════════════════════');
    
    const { email, password } = await c.req.json();
    console.log('📧 Email:', email);
    console.log('🔑 Password provided:', password ? 'YES' : 'NO');
    console.log('🔑 Password length:', password?.length);

    if (!email || !password) {
      console.log('❌ Missing email or password');
      return c.json({ error: 'Email and password are required' }, 400);
    }

    const userKey = `user:${email}`;
    console.log('🔍 Looking up user with key:', userKey);
    
    let userDataJson = await kv.get(userKey);
    console.log('📦 KV get result:', userDataJson ? 'FOUND' : 'NOT FOUND');
    console.log('📦 Type of result:', typeof userDataJson);
    console.log('📦 Result value:', userDataJson);

    // Auto-create default user if logging in with default credentials
    if (!userDataJson && email === 'archit@gmail.com' && password === 'archit@123') {
      console.log('🔧 Auto-creating default user on first login...');
      console.log('🔧 Email matches:', email === 'archit@gmail.com');
      console.log('🔧 Password matches:', password === 'archit@123');
      
      const userId = crypto.randomUUID();
      const defaultUserData = {
        id: userId,
        email: 'archit@gmail.com',
        password: 'archit@123',
        name: 'Archit',
        createdAt: new Date().toISOString(),
      };
      
      console.log('💾 Storing default user...');
      try {
        await kv.set(userKey, JSON.stringify(defaultUserData));
        console.log('✅ User stored successfully');
        
        // Re-fetch to verify
        userDataJson = await kv.get(userKey);
        console.log('🔍 Re-fetched user:', userDataJson ? 'FOUND' : 'NOT FOUND');
        console.log('🔍 Re-fetched value:', userDataJson);
      } catch (setError) {
        console.error('❌ Error storing user:', setError);
        throw setError;
      }
    }

    if (!userDataJson) {
      console.log('❌ User not found after all attempts');
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    console.log('🔄 Parsing user data...');
    const userData = JSON.parse(userDataJson);
    console.log('✅ User data parsed:', { email: userData.email, hasPassword: !!userData.password });

    // Check password
    console.log('🔐 Checking password...');
    console.log('🔐 Stored password:', userData.password);
    console.log('🔐 Provided password:', password);
    console.log('🔐 Passwords match:', userData.password === password);
    
    if (userData.password !== password) {
      console.log('❌ Login failed: Invalid password');
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    // Create session
    console.log('✅ Password correct, creating session...');
    
    const sessionToken = crypto.randomUUID();
    await kv.set(`session:${sessionToken}`, JSON.stringify({
      email: userData.email,
      id: userData.id,
      name: userData.name,
      createdAt: new Date().toISOString()
    }));

    console.log('✅ Login successful, session created');
    console.log('🎫 Session token:', sessionToken);

    return c.json({
      sessionToken,
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name
      },
      message: 'Login successful'
    });
  } catch (error) {
    console.error('❌ Login error (outer catch):', error);
    console.error('❌ Error stack:', error.stack);
    return c.json({ error: 'Failed to login: ' + error.message }, 500);
  }
});

// Sign up new user
app.post("/make-server-b3b8d743/auth/signup", async (c) => {
  try {
    const { email, password, name } = await c.req.json();
    console.log('Signup request for email:', email);

    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }

    const userKey = `user:${email}`;
    const existingUser = await kv.get(userKey);

    if (existingUser) {
      console.log('User already exists:', email);
      return c.json({ error: 'Email already registered' }, 400);
    }

    const userId = crypto.randomUUID();
    const userData = {
      id: userId,
      email,
      password,
      name: name || '',
      createdAt: new Date().toISOString(),
    };

    await kv.set(userKey, JSON.stringify(userData));

    // Create session token
    const sessionToken = crypto.randomUUID();
    await kv.set(`session:${sessionToken}`, JSON.stringify({
      email: userData.email,
      id: userData.id,
      name: userData.name,
      createdAt: new Date().toISOString()
    }));

    console.log('✅ User created successfully:', email);

    return c.json({
      sessionToken,
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name
      },
      message: 'Account created successfully'
    });
  } catch (error) {
    console.log('Signup error:', error);
    return c.json({ error: 'Failed to create account: ' + error.message }, 500);
  }
});

// Verify session endpoint (for protected routes)
app.get("/make-server-b3b8d743/auth/verify", async (c) => {
  try {
    const sessionToken = c.req.header('X-Session-Token');
    
    if (!sessionToken) {
      return c.json({ error: 'No session token provided' }, 401);
    }

    const sessionData = await kv.get(`session:${sessionToken}`);

    if (!sessionData) {
      return c.json({ error: 'Invalid or expired session' }, 401);
    }

    const user = JSON.parse(sessionData);
    return c.json({ user });
  } catch (error) {
    console.log('Auth verification error:', error);
    return c.json({ error: 'Failed to verify session' }, 500);
  }
});

// Logout endpoint
app.post("/make-server-b3b8d743/auth/logout", async (c) => {
  try {
    const sessionToken = c.req.header('X-Session-Token');
    
    if (sessionToken) {
      await kv.del(`session:${sessionToken}`);
    }

    return c.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.log('Logout error:', error);
    return c.json({ error: 'Failed to logout' }, 500);
  }
});

// Upload and process CSV/Excel data
app.post("/make-server-b3b8d743/data/upload", async (c) => {
  try {
    console.log('════════════════════════════════════════');
    console.log('📤 Upload endpoint hit');
    console.log('════════════════════════════════════════');
    
    const sessionToken = c.req.header('X-Session-Token');
    console.log('Session token from header:', sessionToken);
    console.log('Session token length:', sessionToken?.length);
    
    if (!sessionToken) {
      console.log('❌ No session token provided');
      return c.json({ error: 'Unauthorized - No session token' }, 401);
    }

    const sessionKey = `session:${sessionToken}`;
    console.log('Looking up session key:', sessionKey);
    
    const sessionData = await kv.get(sessionKey);
    console.log('Session data from KV:', sessionData ? 'FOUND' : 'NOT FOUND');
    
    if (!sessionData) {
      console.log('❌ Invalid session token - not found in KV store');
      console.log('Tried key:', sessionKey);
      
      // Debug: list all session keys
      const allSessions = await kv.getByPrefix('session:');
      console.log('All sessions in KV store:', allSessions.length);
      allSessions.forEach((s, i) => {
        console.log(`  Session ${i + 1}:`, JSON.parse(s).email);
      });
      
      return c.json({ error: 'Invalid session - please login again' }, 401);
    }

    const session = JSON.parse(sessionData);
    console.log('Data upload request from user:', session.email);

    // Get the uploaded file
    let formData;
    try {
      formData = await c.req.formData();
      console.log('FormData received');
    } catch (formError) {
      console.error('FormData parse error:', formError);
      return c.json({ error: 'Failed to parse form data: ' + formError.message }, 400);
    }

    const file = formData.get('file') as File;

    if (!file) {
      console.log('No file in form data');
      return c.json({ error: 'No file uploaded' }, 400);
    }

    console.log('Processing file:', file.name, 'type:', file.type, 'size:', file.size);

    // Determine file type from extension
    const fileName = file.name.toLowerCase();
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
    const isCsv = fileName.endsWith('.csv');

    console.log('File type detected:', isExcel ? 'Excel' : isCsv ? 'CSV' : 'Unknown');

    let records = [];
    
    try {
      if (isExcel) {
        // Parse Excel file
        console.log('Parsing Excel file...');
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
        
        // Get first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON
        records = XLSX.utils.sheet_to_json(worksheet);
        console.log('Excel parsed, records:', records.length);
      } else if (isCsv) {
        // Parse CSV file
        console.log('Parsing CSV file...');
        const fileContent = await file.text();
        console.log('File content read, length:', fileContent.length);
        
        const lines = fileContent.split('\n').filter(line => line.trim());
        if (lines.length === 0) {
          return c.json({ error: 'File is empty' }, 400);
        }

        const headers = lines[0].split(',').map(h => h.trim().replace(/^\"|\"$/g, ''));
        console.log('Headers found:', headers);

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim().replace(/^\"|\"$/g, ''));
          if (values.length === headers.length) {
            const record: any = {};
            headers.forEach((header, index) => {
              record[header] = values[index];
            });
            records.push(record);
          }
        }

        console.log('CSV parsed, records:', records.length);
      } else {
        return c.json({ error: 'Unsupported file type. Please upload a CSV or Excel file.' }, 400);
      }
    } catch (parseError) {
      console.error('File parse error:', parseError);
      return c.json({ error: 'Failed to parse file: ' + parseError.message }, 400);
    }

    if (!records || records.length === 0) {
      return c.json({ error: 'No data found in file' }, 400);
    }

    // Validate required columns
    const requiredColumns = [
      'Date',
      'Time',
      'Transaction_ID',
      'Customer_ID',
      'Product_Service_Name',
      'Category',
      'Subcategory',
      'Brand',
      'Price'
    ];

    const firstRecord = records[0];
    const fileColumns = Object.keys(firstRecord);
    const missingColumns = requiredColumns.filter(col => !fileColumns.includes(col));

    if (missingColumns.length > 0) {
      console.log('Missing columns:', missingColumns);
      return c.json({ 
        error: `Missing required columns: ${missingColumns.join(', ')}`,
        found: fileColumns,
        required: requiredColumns
      }, 400);
    }

    // Validate and clean data
    const validRecords = records.filter((record: any) => {
      // Check all required fields are present
      const hasAllFields = requiredColumns.every(col => record[col] && record[col].toString().trim() !== '');
      
      // Validate price is a number
      const price = parseFloat(record.Price);
      const validPrice = !isNaN(price) && price >= 0;

      return hasAllFields && validPrice;
    });

    if (validRecords.length === 0) {
      return c.json({ error: 'No valid records found. Please check your data format.' }, 400);
    }

    console.log('Valid records:', validRecords.length);

    // Store the data in KV store as temporary upload
    const dataKey = `data:${session.email}`;
    try {
      await kv.set(dataKey, JSON.stringify({
        records: validRecords,
        uploadedAt: new Date().toISOString(),
        fileName: file.name,
        recordCount: validRecords.length
      }));
      console.log('✅ Data stored successfully as temporary upload for user:', session.email);
      
      // Clear the "has_saved_data" flag since this is a new upload
      // User will need to explicitly save to database
      await kv.del(`has_saved_data:${session.email}`);
      console.log('🗑️ Cleared saved data flag - new upload is temporary');
    } catch (storeError) {
      console.error('KV store error:', storeError);
      return c.json({ error: 'Failed to store data: ' + storeError.message }, 500);
    }

    return c.json({
      message: 'File uploaded and processed successfully',
      rowCount: validRecords.length,
      skippedRows: records.length - validRecords.length
    });
  } catch (error) {
    console.error('Upload error (outer catch):', error);
    return c.json({ error: 'Failed to process file: ' + (error?.message || 'Unknown error') }, 500);
  }
});

// Get user's uploaded data (prioritizes saved database data over temporary uploads)
app.get("/make-server-b3b8d743/data/transactions", async (c) => {
  try {
    const sessionToken = c.req.header('X-Session-Token');
    
    if (!sessionToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const sessionData = await kv.get(`session:${sessionToken}`);
    if (!sessionData) {
      return c.json({ error: 'Invalid session' }, 401);
    }

    const session = JSON.parse(sessionData);
    
    // First, check if user has saved data in database
    const hasSaved = await kv.get(`has_saved_data:${session.email}`);
    
    if (hasSaved === 'true') {
      console.log('📊 Retrieving saved database transactions for:', session.email);
      
      // Get all saved transactions for this user
      const savedTransactions = await kv.getByPrefix(`transaction:${session.email}:`);
      
      if (savedTransactions && savedTransactions.length > 0) {
        const records = savedTransactions.map(t => {
          const transaction = JSON.parse(t);
          return {
            Date: transaction.Date,
            Time: transaction.Time,
            Transaction_ID: transaction.Transaction_ID,
            Customer_ID: transaction.Customer_ID,
            Product_Service_Name: transaction.Product_Service_Name,
            Category: transaction.Category,
            Subcategory: transaction.Subcategory,
            Brand: transaction.Brand,
            Price: transaction.Price
          };
        });
        
        console.log('✅ Retrieved', records.length, 'saved transactions from database');
        
        return c.json({
          hasData: true,
          records: records,
          uploadedAt: JSON.parse(savedTransactions[0]).savedAt,
          fileName: 'Database Records',
          recordCount: records.length,
          isSaved: true
        });
      }
    }
    
    // If no saved data, check for temporary uploaded data
    const dataKey = `data:${session.email}`;
    const dataJson = await kv.get(dataKey);
    
    if (!dataJson) {
      return c.json({ 
        hasData: false,
        records: [],
        message: 'No data uploaded yet'
      });
    }

    const data = JSON.parse(dataJson);
    console.log('📊 Retrieved temporary uploaded data');
    
    return c.json({
      hasData: true,
      records: data.records,
      uploadedAt: data.uploadedAt,
      fileName: data.fileName,
      recordCount: data.recordCount,
      isSaved: false
    });
  } catch (error) {
    console.error('Get data error:', error);
    return c.json({ error: 'Failed to retrieve data: ' + error.message }, 500);
  }
});

// Save transactions to database permanently
app.post("/make-server-b3b8d743/data/save-to-database", async (c) => {
  try {
    console.log('💾 Save to database request received');
    
    const sessionToken = c.req.header('X-Session-Token');
    
    if (!sessionToken) {
      console.log('❌ No session token');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const sessionData = await kv.get(`session:${sessionToken}`);
    if (!sessionData) {
      console.log('❌ Invalid session');
      return c.json({ error: 'Invalid session' }, 401);
    }

    const session = JSON.parse(sessionData);
    console.log('👤 User:', session.email);
    
    // Get the temporary uploaded data
    const dataKey = `data:${session.email}`;
    const dataJson = await kv.get(dataKey);
    
    if (!dataJson) {
      console.log('❌ No temporary data found');
      return c.json({ error: 'No data to save' }, 400);
    }

    const data = JSON.parse(dataJson);
    const transactions = data.records;
    
    console.log('📊 Saving', transactions.length, 'transactions to database...');
    
    // Check for existing transactions to aggregate with
    const existingTransactions = await kv.getByPrefix(`transaction:${session.email}:`);
    let existingCount = existingTransactions ? existingTransactions.length : 0;
    console.log('📦 Found', existingCount, 'existing transactions in database');
    
    // Get the current counter value (continue from existing, don't reset)
    const counterKey = `transaction_counter:${session.email}`;
    let counter = 0;
    const counterJson = await kv.get(counterKey);
    if (counterJson) {
      counter = parseInt(counterJson);
      console.log('📊 Starting from counter:', counter);
    }
    
    // Append new transactions (don't delete old ones)
    const savedTransactions = [];
    for (const transaction of transactions) {
      counter++;
      const transactionId = counter;
      const transactionKey = `transaction:${session.email}:${transactionId}`;
      
      const transactionData = {
        id: transactionId,
        userId: session.id,
        userEmail: session.email,
        Date: transaction.Date,
        Time: transaction.Time,
        Transaction_ID: transaction.Transaction_ID,
        Customer_ID: transaction.Customer_ID,
        Product_Service_Name: transaction.Product_Service_Name,
        Category: transaction.Category,
        Subcategory: transaction.Subcategory,
        Brand: transaction.Brand,
        Price: transaction.Price,
        savedAt: new Date().toISOString()
      };
      
      await kv.set(transactionKey, JSON.stringify(transactionData));
      savedTransactions.push(transactionData);
    }
    
    // Update the counter
    await kv.set(counterKey, counter.toString());
    
    // Mark that this user has saved data
    await kv.set(`has_saved_data:${session.email}`, 'true');
    
    // Clear the temporary upload data
    await kv.del(dataKey);
    
    console.log('✅ Successfully saved', savedTransactions.length, 'new transactions');
    console.log('📈 Updated counter value:', counter);
    console.log('📊 Total transactions in database:', counter);
    
    return c.json({
      message: 'Transactions saved to database successfully',
      savedCount: savedTransactions.length,
      totalSaved: counter,
      previousTotal: existingCount
    });
  } catch (error) {
    console.error('❌ Save to database error:', error);
    return c.json({ error: 'Failed to save to database: ' + error.message }, 500);
  }
});

// Check if user has saved data
app.get("/make-server-b3b8d743/data/has-saved", async (c) => {
  try {
    const sessionToken = c.req.header('X-Session-Token');
    
    if (!sessionToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const sessionData = await kv.get(`session:${sessionToken}`);
    if (!sessionData) {
      return c.json({ error: 'Invalid session' }, 401);
    }

    const session = JSON.parse(sessionData);
    const hasSaved = await kv.get(`has_saved_data:${session.email}`);
    
    return c.json({
      hasSaved: hasSaved === 'true'
    });
  } catch (error) {
    console.error('Check saved data error:', error);
    return c.json({ error: 'Failed to check saved status' }, 500);
  }
});

// Clear all database transactions for a user
app.delete("/make-server-b3b8d743/data/clear-database", async (c) => {
  try {
    console.log('🗑️ Clear database request received');
    
    const sessionToken = c.req.header('X-Session-Token');
    
    if (!sessionToken) {
      console.log('❌ No session token');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const sessionData = await kv.get(`session:${sessionToken}`);
    if (!sessionData) {
      console.log('❌ Invalid session');
      return c.json({ error: 'Invalid session' }, 401);
    }

    const session = JSON.parse(sessionData);
    console.log('👤 Clearing all data for user:', session.email);
    
    // Get all saved transactions
    const transactions = await kv.getByPrefix(`transaction:${session.email}:`);
    
    if (transactions && transactions.length > 0) {
      console.log('🗑️ Deleting', transactions.length, 'transactions...');
      
      // Delete each transaction
      for (const txJson of transactions) {
        const tx = JSON.parse(txJson);
        await kv.del(`transaction:${session.email}:${tx.id}`);
      }
    }
    
    // Reset the counter
    await kv.del(`transaction_counter:${session.email}`);
    
    // Clear the has_saved_data flag
    await kv.del(`has_saved_data:${session.email}`);
    
    // Clear any temporary data
    await kv.del(`data:${session.email}`);
    
    console.log('✅ Successfully cleared all data for user');
    
    return c.json({
      message: 'All database transactions cleared successfully',
      deletedCount: transactions ? transactions.length : 0
    });
  } catch (error) {
    console.error('❌ Clear database error:', error);
    return c.json({ error: 'Failed to clear database: ' + error.message }, 500);
  }
});

console.log('🚀 AI CFO Server started successfully');
console.log('📝 Default login: archit@gmail.com / archit@123');

Deno.serve(app.fetch);
