import React, { useEffect, useState } from 'react';
import {
  Page,
  Layout,
  Card,
  DataTable,
  TextStyle,
  Icon,
  Badge,
  Stack,
} from '@shopify/polaris';
import {
  CustomersMajor,
  ProductsMajor,
} from '@shopify/polaris-icons';
import { useQuery } from "react-query";
import { useAppBridge } from '@shopify/app-bridge-react';
export function DashboardComponent() {
  // Mock data - replace with real data in your actual implementation

  const shopify = useAppBridge();

  const {
    data: productsData,
    refetch: refetchProductDetails,
    isLoading: isLoadingProducts,
    isError: isErrorProducts,
    error: productError,
  } = useQuery({
    queryKey: ["productsDetails"], // Unique key for the query
    queryFn: async () => {
      const response = await fetch("/api/products/details");
      const data = await response.json(); // Parse JSON once
   
  
      if (!response.ok) {
        throw new Error("Failed to fetch product details.");
      }
      return data; // Return the parsed data, not calling json() again
    },
    refetchOnWindowFocus: false, // Optional: Prevent refetching on window focus
  });


  // const {
  //   data: customersData,
  //   refetch: refetchCustomerDetails,
  //   isLoading: isLoadingCustomers,
  //   isError: isErrorCustomers,
  //   error: customerError,
  // } = useQuery({
  //   queryKey: ["customersDetails"], // Unique key for the query
  //   queryFn: async () => {
  //     const response = await fetch("/api/customers/details");
  //     const data = await response.json(); // Parse JSON once
  //     console.log("customer" + response);
  //     console.log("customer" + data); // Log the data to see what is returned
  
  //     if (!response.ok) {
  //       throw new Error("Failed to fetch product details.");
  //     }
  //     return data; // Return the parsed data, not calling json() again
  //   },
  //   refetchOnWindowFocus: false, // Optional: Prevent refetching on window focus
  // });
 
 console.log("error" + productError)
  
  if(!productsData){
    console.log("hello")
    refetchProductDetails();
  }
  
  const customerCount = 1;
  const productCount = productsData.products.length;
 

  const recentCustomers = [
    ['John Doe', 'john@example.com', '2023-05-15', 'Active'],
    ['Jane Smith', 'jane@example.com', '2023-05-14', 'Active'],
    ['Bob Johnson', 'bob@example.com', '2023-05-13', 'Inactive'],
    ['Alice Brown', 'alice@example.com', '2023-05-12', 'Active'],
    ['Charlie Davis', 'charlie@example.com', '2023-05-11', 'Active'],
  ];

  const recentProducts = [
    ['Widget A', '$19.99', '50', 'In Stock'],
    ['Gadget B', '$29.99', '30', 'Low Stock'],
    ['Tool C', '$39.99', '20', 'In Stock'],
    ['Device D', '$49.99', '10', 'Low Stock'],
    ['Item E', '$59.99', '0', 'Out of Stock'],
  ];

  return (
    <Page title="Dashboard" narrowWidth>
      <Layout>
        <Layout.Section>
          <Card sectioned>
            <Stack distribution="fillEvenly">
              <Stack alignment="center" spacing="tight">
                <div style={{ padding: '0.75rem', borderRadius: '50%', background: 'var(--p-surface-neutral)' }}>
                  <Icon source={CustomersMajor} color="highlight" />
                </div>
                <Stack vertical spacing="extraTight">
                  <TextStyle variation="subdued">Total Customers</TextStyle>
                  <TextStyle variation="strong" size="large">{customerCount}</TextStyle>
                </Stack>
              </Stack>
              <Stack alignment="center" spacing="tight">
                <div style={{ padding: '0.75rem', borderRadius: '50%', background: 'var(--p-surface-neutral)' }}>
                  <Icon source={ProductsMajor} color="highlight" />
                </div>
                <Stack vertical spacing="extraTight">
                  <TextStyle variation="subdued">Total Products</TextStyle>
                  <TextStyle variation="strong" size="large">{productCount}</TextStyle>
                </Stack>
              </Stack>
            </Stack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card title="Recent Customers" sectioned>
            <DataTable
              columnContentTypes={['text', 'text', 'text', 'text']}
              headings={['Name', 'Email', 'Date Joined', 'Status']}
              rows={recentCustomers?.map(([name, email, date, status]) => [
                name,
                email,
                date,
                <Badge status={status === 'Active' ? 'success' : 'warning'}>{status}</Badge>
              ])}
            />
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card title="Recent Products" sectioned>
            {productsData &&
            <DataTable
              columnContentTypes={['text', 'text', 'numeric', 'text']}
              headings={['Product Name', 'Price', 'Stock', 'Status']}
              rows={productsData?.products?.map((product) => [
                product?.name,
                product?.price,
                product?.stock,
                product?.status
              ])}
            />}
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}