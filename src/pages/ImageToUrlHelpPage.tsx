"use client";

import React from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Image, Link as LinkIcon, UploadCloud, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ImageToUrlHelpPage = () => {
  const navigate = useNavigate();

  const handleExternalLink = (url: string) => {
    window.open(url, "_blank");
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <div className="max-w-md mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="text-muted-foreground hover:text-secondary-neon">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        
        <h1 className="text-4xl font-bold text-center text-foreground">Image to URL Guide</h1>

        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <Image className="h-5 w-5 text-secondary-neon" /> How to Get an Image URL
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-6">
            <p className="text-sm text-muted-foreground">
              To display images in the app (like for products or profile pictures), you need a direct link. Here are the most reliable methods:
            </p>

            {/* METHOD 1: POSTIMAGES (REPLACES IMGUR) */}
            <div className="space-y-3 p-3 bg-secondary/5 rounded-lg border border-border/50">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <UploadCloud className="h-4 w-4 text-green-500" /> 1. Using PostImages (Easiest)
              </h3>
              <p className="text-xs text-muted-foreground mb-2">No sign-up required. Fast and reliable.</p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1.5 pl-2">
                <li>Go to <strong>PostImages.org</strong>.</li>
                <li>Click <strong>"Choose images"</strong> and upload your file.</li>
                <li>Once uploaded, look for the box labeled <strong>"Direct link"</strong> (usually the second option).</li>
                <li>Copy that link. It should end with <code>.jpg</code> or <code>.png</code>.</li>
              </ul>
              <div className="pt-2">
                <Button variant="outline" onClick={() => handleExternalLink("https://postimages.org/")} className="h-8 text-xs w-full sm:w-auto border-secondary-neon/50 text-secondary-neon hover:bg-secondary-neon/10">
                  Open PostImages <LinkIcon className="ml-2 h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* METHOD 2: GOOGLE DRIVE */}
            <div className="space-y-3 p-3 bg-secondary/5 rounded-lg border border-border/50">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <UploadCloud className="h-4 w-4 text-blue-500" /> 2. Using Google Drive
              </h3>
              <p className="text-xs text-muted-foreground mb-2">Best if you want to keep files in your own cloud.</p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1.5 pl-2">
                <li>Upload your image to Drive.</li>
                <li>Right-click &gt; <strong>Share</strong> &gt; Change access to <strong>"Anyone with the link"</strong>.</li>
                <li>Copy the link. It looks like: <br/><code className="text-[10px] bg-muted p-0.5 rounded">drive.google.com/file/d/FILE_ID/view</code></li>
                <li className="text-foreground font-medium">To make it work in the app, use this format:</li>
                <code className="block text-[10px] bg-black/80 text-white p-2 rounded mt-1 break-all">
                  https://drive.google.com/uc?export=view&id=FILE_ID
                </code>
                <li className="text-xs italic mt-1">(Replace <code>FILE_ID</code> with the long code from your link).</li>
              </ul>
              <div className="pt-2">
                <Button variant="outline" onClick={() => handleExternalLink("https://drive.google.com/")} className="h-8 text-xs w-full sm:w-auto border-blue-500/50 text-blue-500 hover:bg-blue-500/10">
                  Open Google Drive <LinkIcon className="ml-2 h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* VERIFICATION TIP */}
            <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-md flex gap-3 items-start">
                <CheckCircle2 className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                <div className="text-sm">
                    <p className="font-bold text-yellow-700 dark:text-yellow-500">How to verify?</p>
                    <p className="text-muted-foreground text-xs mt-1">
                        Paste the URL in a new browser tab. If the image loads <strong>alone</strong> (without a website wrapper around it), it is a valid direct link.
                    </p>
                </div>
            </div>

          </CardContent>
        </Card>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default ImageToUrlHelpPage;