"use client";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Button from '@mui/material/Button';
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import OutlinedInput from "@mui/material/OutlinedInput";
import FormHelperText from "@mui/material/FormHelperText";
import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import { useRouter } from 'next/navigation';

interface ButtonProps {
 children: React.ReactNode;
 disabled: boolean;
 variant: 'primary' | 'secondary'; // Assuming variants you support
 type?: 'button' | 'submit' | 'reset'; // Add this line
}

const defaultValues = { email: "", password: "" }; // Hardcoded email and password

// Define validation schema with Zod
const schema = z.object({
 email: z.string().email("Please enter a valid email address"),
 password: z.string().min(6, "Password must be at least 6 characters long"),
});

export default function SignInForm() {
 const router = useRouter();
 const [isPending, setIsPending] = useState(false);
 const { control, handleSubmit, setError, formState: { errors } } = useForm({
 defaultValues,
 resolver: zodResolver(schema),
 });

 // Hardcoded ID for the user
 const userId = 123;

 const onSubmit = async (values: any) => {
 setIsPending(true);

 try {
 // Here, you can include the hardcoded userId in the form submission
 const submissionData = { ...values, userId };

 console.log("Form data with hardcoded userId and password: ", submissionData);
 if(submissionData.email==='user@example.com' && submissionData.password==='123456'){
 console.log("User signed in successfully");
 router.push(`/dashboard`);
 }

 } catch (err) {
 setError("root", { type: "server", message: "Something went wrong!" });
 } finally {
 setIsPending(false);
 }
 };

 return (
 <div className="flex flex-col flex-1 lg:w-1/2 w-full">
 <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
 <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
 Sign In
 </h1>
 <form onSubmit={handleSubmit(onSubmit)}>
 <Stack spacing={2}>
 <Controller
 control={control}
 name="email"
 render={({ field }) => (
 <FormControl error={Boolean(errors.email)}>
 <InputLabel>Email address</InputLabel>
 <OutlinedInput {...field} label="Email address" type="email" />
 {errors.email && <FormHelperText>{errors.email.message}</FormHelperText>}
 </FormControl>
 )}
 />
 <Controller
 control={control}
 name="password"
 render={({ field }) => (
 <FormControl error={Boolean(errors.password)}>
 <InputLabel>Password</InputLabel>
 <OutlinedInput {...field} label="Password" type="password" />
 {errors.password && <FormHelperText>{errors.password.message}</FormHelperText>}
 </FormControl>
 )}
 />
 {errors.root && <Alert color="error">{errors.root.message}</Alert>}
 <Button disabled={isPending} type="submit" variant="contained">
 Sign in
 </Button>
 </Stack>
 </form>
 </div>
 </div>
 );
}