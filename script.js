document.addEventListener("DOMContentLoaded", () => {
  const uploadButton = document.getElementById("uploadButton");
  const imageUpload = document.getElementById("imageUpload");
  const cropperContainer = document.getElementById("cropperContainer");
  const frameSelector = document.getElementById("frameSelector");
  const actionButtons = document.getElementById("actionButtons");
  const cropButton = document.getElementById("cropButton");
  const downloadButton = document.getElementById("downloadButton");
  const resultContainer = document.getElementById("resultContainer");
  const resultCanvas = document.getElementById("resultCanvas");
  const feedbackElement = document.getElementById("feedback");
  const customFrameButton = document.getElementById("customFrameButton");
  const customFrameUpload = document.getElementById("customFrameUpload");
  const customFrameContainer = document.getElementById("customFrameContainer");
  const customFrameOption = document.getElementById("customFrameOption");
  let customFrameSrc = "";

  let cropper;
  let selectedFrame = "frame1"; // Default frame

  // Show file picker when upload button is clicked
  uploadButton.addEventListener("click", () => {
    imageUpload.click();
  });
  customFrameButton.addEventListener("click", () => {
    customFrameUpload.click();
  });

  // Handle image upload
  imageUpload.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = document.getElementById("image");
        img.src = event.target.result;
        cropperContainer.classList.remove("hidden");
        frameSelector.classList.remove("hidden");
        actionButtons.classList.remove("hidden");
        resultContainer.classList.add("hidden");

        if (cropper) {
          cropper.destroy();
        }

        cropper = new Cropper(img, {
          aspectRatio: 1,
          viewMode: 1,
          responsive: true,
          background: false,
        });

        showFeedback(
          "Image uploaded successfully. You can now crop and frame your image."
        );
      };
      reader.readAsDataURL(file);
    }
  });
  customFrameUpload.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        // Display the custom frame
        const img = customFrameOption.querySelector("img");
        img.src = event.target.result;
        customFrameContainer.classList.remove("hidden");

        // Store the custom frame source
        customFrameSrc = event.target.result;

        // Apply the custom frame when selected
        customFrameOption.addEventListener("click", function () {
          // Highlight the selected frame
          document.querySelectorAll(".frame-option img").forEach((img) => {
            img.classList.remove("border-blue-500");
          });
          this.querySelector("img").classList.add("border-blue-500");

          // Set selected frame to custom frame
          selectedFrame = "customFrame";
        });
      };
      reader.readAsDataURL(file);
    }
  });

  // Handle frame selection from thumbnails
  const frameOptions = document.querySelectorAll(".frame-option");
  frameOptions.forEach((option) => {
    option.addEventListener("click", function () {
      // Remove previous highlight
      frameOptions.forEach((o) =>
        o.querySelector("img").classList.remove("border-blue-500")
      );

      // Highlight the selected frame
      this.querySelector("img").classList.add("border-blue-500");

      // Update the selected frame
      selectedFrame = this.getAttribute("data-frame");
    });
  });

  // Handle cropping and framing
  cropButton.addEventListener("click", () => {
    if (!cropper) {
      showFeedback("Please upload an image first.", "error");
      return;
    }

    const croppedCanvas = cropper.getCroppedCanvas();

    applyFrameToImage(croppedCanvas, selectedFrame).then((framedCanvas) => {
      resultCanvas.width = framedCanvas.width;
      resultCanvas.height = framedCanvas.height;
      resultCanvas.getContext("2d").drawImage(framedCanvas, 0, 0);
      resultContainer.classList.remove("hidden");
      showFeedback(
        "Image cropped and framed successfully. You can now download your image."
      );
    });
  });

  // Handle image download
  downloadButton.addEventListener("click", () => {
    if (resultCanvas.width === 0) {
      showFeedback("Please crop and frame an image first.", "error");
      return;
    }

    const link = document.createElement("a");
    link.download = "framed_image.png";
    link.href = resultCanvas.toDataURL();
    link.click();
    showFeedback("Image downloaded successfully.");
  });

  function applyFrameToImage(canvas, frameType) {
    return new Promise((resolve, reject) => {
      const frame = new Image();

      // If custom frame, use the uploaded frame
      if (frameType === "customFrame") {
        frame.src = customFrameSrc;
      } else {
        frame.src = `frames/${frameType}.png`;
      }

      // Make sure to load the frame before drawing
      frame.onload = () => {
        const framedCanvas = document.createElement("canvas");
        const ctx = framedCanvas.getContext("2d");
        const padding = 20;
        const size = Math.min(canvas.width, canvas.height); // Ensuring the image is a square for the circle

        framedCanvas.width = size + padding * 2;
        framedCanvas.height = size + padding * 2;

        // Create a circular clipping path
        ctx.save();
        ctx.beginPath();
        const centerX = framedCanvas.width / 2;
        const centerY = framedCanvas.height / 2;
        const radius = size / 2;
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        // Draw the cropped image inside the circular clipping path
        ctx.drawImage(
          canvas,
          (framedCanvas.width - size) / 2, // X position (centers the image)
          (framedCanvas.height - size) / 2, // Y position (centers the image)
          size,
          size
        );

        // After image is clipped and drawn, draw the frame on top
        ctx.restore(); // Ensure the clip path is not applied to the frame
        ctx.drawImage(frame, 0, 0, framedCanvas.width, framedCanvas.height);

        // Resolve with the framed image
        resolve(framedCanvas);
      };

      frame.onerror = () => {
        reject(new Error(`Failed to load frame: ${frameType}`));
      };
    });
  }

  // Show feedback message
  function showFeedback(message, type = "success") {
    feedbackElement.textContent = message;
    feedbackElement.className =
      type === "success" ? "text-green-600" : "text-red-600";
  }
});
