import React, { useState } from "react";
import { Container, VStack, Text, Input, Button, Table, Thead, Tbody, Tr, Th, Td, IconButton, Box, Textarea } from "@chakra-ui/react";
import { FaTrash, FaPlus } from "react-icons/fa";
import * as SQLite from "sql.js";

const Index = () => {
  const [db, setDb] = useState(null);
  const [isDbInitialized, setIsDbInitialized] = useState(false);
  const [tableData, setTableData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [sqlCommand, setSqlCommand] = useState("");
  const [sqlResult, setSqlResult] = useState("");

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && (file.name.endsWith(".sqlite") || file.name.endsWith(".db"))) {
      const reader = new FileReader();
      reader.onload = () => {
        const Uints = new Uint8Array(reader.result);
        const database = new SQLite.Database(Uints);
        setDb(database);
        loadTableData(database);
        setIsDbInitialized(true); // Set database as initialized
      };
      reader.readAsArrayBuffer(file);
    } else {
      setSqlResult("Error: Please upload a valid SQLite database file.");
    }
  };

  const loadTableData = (database) => {
    try {
      const res = database.exec("SELECT name FROM sqlite_master WHERE type='table'");
      if (res.length > 0) {
        const tableName = res[0].values[0][0];
        const tableRes = database.exec(`SELECT * FROM ${tableName}`);
        if (tableRes.length > 0) {
          setColumns(tableRes[0].columns);
          setTableData(tableRes[0].values);
        }
      }
    } catch (error) {
      setSqlResult("Error loading table data: " + error.message);
    }
  };

  const handleAddRow = () => {
    setTableData([...tableData, Array(columns.length).fill("")]);
  };

  const handleRemoveRow = (index) => {
    const newData = tableData.filter((_, i) => i !== index);
    setTableData(newData);
  };

  const handleInputChange = (value, rowIndex, colIndex) => {
    const newData = tableData.map((row, i) => (i === rowIndex ? row.map((col, j) => (j === colIndex ? value : col)) : row));
    setTableData(newData);
  };

  const handleSqlCommandChange = (event) => {
    setSqlCommand(event.target.value);
  };

  const executeSqlCommand = () => {
    if (!isDbInitialized) {
      setSqlResult("Error: Database is not initialized.");
      return;
    }
    try {
      const res = db.exec(sqlCommand);
      setSqlResult(JSON.stringify(res, null, 2));
    } catch (error) {
      setSqlResult(error.message);
    }
  };

  return (
    <Container centerContent maxW="container.xl" py={10}>
      <VStack spacing={4} width="100%">
        <Text fontSize="2xl">SQLite Database Manager</Text>
        <Input type="file" onChange={handleFileUpload} />
        {columns.length > 0 && (
          <Box width="100%" overflowX="auto">
            <Table variant="simple">
              <Thead>
                <Tr>
                  {columns.map((col, index) => (
                    <Th key={index}>{col}</Th>
                  ))}
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {tableData.map((row, rowIndex) => (
                  <Tr key={rowIndex}>
                    {row.map((col, colIndex) => (
                      <Td key={colIndex}>
                        <Input value={col} onChange={(e) => handleInputChange(e.target.value, rowIndex, colIndex)} />
                      </Td>
                    ))}
                    <Td>
                      <IconButton aria-label="Remove row" icon={<FaTrash />} onClick={() => handleRemoveRow(rowIndex)} />
                    </Td>
                  </Tr>
                ))}
                <Tr>
                  <Td colSpan={columns.length + 1}>
                    <Button leftIcon={<FaPlus />} onClick={handleAddRow}>
                      Add Row
                    </Button>
                  </Td>
                </Tr>
              </Tbody>
            </Table>
          </Box>
        )}
        <Textarea placeholder="Enter SQL command" value={sqlCommand} onChange={handleSqlCommandChange} />
        <Button onClick={executeSqlCommand}>Execute SQL Command</Button>
        {sqlResult && (
          <Box width="100%" bg="gray.100" p={4} borderRadius="md">
            <Text fontSize="md" whiteSpace="pre-wrap">
              {sqlResult}
            </Text>
          </Box>
        )}
      </VStack>
    </Container>
  );
};

export default Index;