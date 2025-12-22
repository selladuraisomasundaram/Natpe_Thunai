"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ServicePost } from "@/hooks/useServiceListings";
import { useAuth } from "@/context/AuthContext";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID } from "@/lib/appwrite";
import { ID, Query } from 'appwrite';
import { Loader2, DollarSign, Truck } from "lucide-react";
import { DEVELOPER_UPI_ID } from "@/lib/config";
import AmbassadorDeliveryOption from "@/components/AmbassadorDeliveryOption";
import { useNavigate } from "react-router-dom";

interface ServicePaymentDialogProps {
  service: ServicePost;
  onPaymentInitiated: () => void;
  onCancel: () => void;
}

const ServicePaymentDialog: React.FC<ServicePaymentDialogProps> = ({ service, onPaymentInitiated, onCancel }) => {
  const { user, userProfile, incrementAmbassadorDeliveriesCount } = useAuth();
  const navigate = useNavigate();
  const [ambassadorDelivery, setAmbassadorDelivery] = useState(false);
  const [ambassadorMessage, setAmbassadorMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleInitiateServicePayment = async () => {
    if (!user || !userProfile || !service) return;

    if (!service.posterId || service.posterId.trim() === "") {
      toast.error("Service provider information is missing or invalid. Cannot proceed with payment.");
      console.error("Service poster ID is missing or empty for service:", service);
      return;
    }

    setIsProcessing(true);

    const priceMatch = service.price.match(/₹(\d+(\.\d+)?)/);
    const transactionAmount = priceMatch ? parseFloat(priceMatch[1]) : 0;

    if (isNaN(transactionAmount) || transactionAmount <= 0) {
      toast.error("Invalid service price.");
      setIsProcessing(false);
      return;
    }

    const transactionNote = `Payment for Service: ${service.title}`;

    try {
      // Check for existing initiated transaction for this service by this user
      const existingTransactions = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_TRANSACTIONS_COLLECTION_ID,
        [
          Query.equal('productId', service.$id), // Using service ID as product ID for transaction
          Query.equal('buyerId', user.$id),
          Query.equal('status', 'initiated'), // Check for transactions that are still pending payment
          Query.limit(1)
        ]
      );

      if (existingTransactions.documents.length > 0) {
        toast.info("You already have an initiated payment for this service. Please complete it or wait for it to expire.");
        setIsProcessing(false);
        onPaymentInitiated(); // Close dialog
        navigate(`/services/confirm-payment/${existingTransactions.documents[0].$id}`);
        return;
      }

      // Create Appwrite Transaction Document (Status: initiated)
      const newTransaction = await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_TRANSACTIONS_COLLECTION_ID,
        ID.unique(),
        {
          productId: service.$id, // Using service ID as product ID
          productTitle: service.title,
          buyerId: user.$id,
          buyerName: user.name,
          sellerId: service.posterId, // Service provider is the 'seller'
          sellerName: service.posterName,
          sellerUpiId: userProfile.upiId, // This will be replaced by actual provider UPI later
          amount: transactionAmount,
          status: "initiated",
          type: "service", // Mark as service transaction
          isBargain: false, // This dialog is for direct payment, not bargain
          collegeName: userProfile.collegeName,
          ambassadorDelivery: ambassadorDelivery,
          ambassadorMessage: ambassadorMessage || null,
        }
      );

      const transactionId = newTransaction.$id;

      // Increment ambassador deliveries count if opted
      if (ambassadorDelivery) {
        await incrementAmbassadorDeliveriesCount();
      }

      // Generate UPI Deep Link (Payment goes to Developer UPI ID)
      const upiDeepLink = `upi://pay?pa=${DEVELOPER_UPI_ID}&pn=NatpeThunaiDevelopers&am=${transactionAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(transactionNote + ` (TX ID: ${transactionId})`)}`;

      // Redirect to UPI App
      window.open(upiDeepLink, "_blank");

      toast.info(`Redirecting to UPI app to pay ₹${transactionAmount.toFixed(2)} to the developer. Please complete the payment and note the UTR ID.`);

      // Redirect to Confirmation Page
      onPaymentInitiated(); // Close dialog and trigger parent callback
      navigate(`/services/confirm-payment/${transactionId}`); // Navigate to a generic confirmation/tracking page

    } catch (error: any) {
      console.error("Error initiating service payment transaction:", error);
      toast.error(error.message || "Failed to initiate service payment transaction.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4 py-4">
      <div className="space-y-3 py-2">
        <p className="font-bold text-red-500">Important: This is a non-Escrow payment system.</p>
        <p className="text-sm text-muted-foreground">You are about to place this order and will be redirected to your UPI app to complete the secure payment of the **full amount** to the developer's provided UPI ID. Natpe🤝Thunai developers will then transfer the net amount to the service provider.</p>
      </div>
      <div className="space-y-3 py-2">
        <p className="text-sm text-foreground">Service: <span className="font-semibold">{service.title}</span></p>
        <p className="text-xl font-bold text-secondary-neon">
          Price: {service.price}
        </p>
        <p className="text-xs text-muted-foreground">Provider: {service.posterName}</p>
        <p className="text-xs text-destructive-foreground">
          Payment will be made to Natpe Thunai Developers, who will then transfer the net amount to the service provider.
        </p>
      </div>

      <AmbassadorDeliveryOption
        ambassadorDelivery={ambassadorDelivery}
        setAmbassadorDelivery={setAmbassadorDelivery}
        ambassadorMessage={ambassadorMessage}
        setAmbassadorMessage={setAmbassadorMessage}
      />

      <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isProcessing} className="w-full sm:w-auto border-border text-primary-foreground hover:bg-muted">
          Cancel
        </Button>
        <Button onClick={handleInitiateServicePayment} disabled={isProcessing} className="w-full sm:w-auto bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">
          {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Proceed to Payment"}
        </Button>
      </DialogFooter>
    </div>
  );
};

export default ServicePaymentDialog;