"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface TrainingInstructionsProps {
  className?: string
}

export function TrainingInstructions({ className }: TrainingInstructionsProps) {
  const trainingSteps = [
    {
      step: 1,
      title: "Prepare Training Data",
      description: "Ensure you have sufficient labeled network flow data (recommended: 50,000+ samples)",
      command: "# Verify data quality and balance\npython scripts/validate_training_data.py",
    },
    {
      step: 2,
      title: "Run Training Script",
      description: "Execute the training script to create a new Sentry model",
      command: "python train_sentry.py --data-path ./data/flows.csv --output-dir ./models/",
    },
    {
      step: 3,
      title: "Evaluate Model",
      description: "Review the generated confusion matrix and performance metrics",
      command: "# Check generated files:\n# - sentry_model.pkl\n# - label_encoder.pkl\n# - confusion_matrix.png",
    },
    {
      step: 4,
      title: "Deploy Model",
      description: "Replace the current model files and restart the Sentinel-QoS service",
      command:
        "# Backup current model\ncp sentry_model.pkl sentry_model_backup.pkl\n\n# Deploy new model\ncp ./models/sentry_model.pkl ./\ncp ./models/label_encoder.pkl ./",
    },
  ]

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="text-xl font-display">Model Retraining Instructions</CardTitle>
        <p className="text-sm text-muted-foreground">
          Step-by-step guide to retrain the Sentry classification model with new data
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Prerequisites Alert */}
        <Alert>
          <AlertTitle>Prerequisites</AlertTitle>
          <AlertDescription className="text-sm">
            Ensure you have Python 3.8+, scikit-learn, lightgbm, and pandas installed. Training requires at least 4GB
            RAM and may take 10-30 minutes depending on data size.
          </AlertDescription>
        </Alert>

        {/* Training Steps */}
        <div className="space-y-4">
          {trainingSteps.map((step) => (
            <div key={step.step} className="border border-border rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Badge variant="secondary" className="bg-primary text-primary-foreground">
                  {step.step}
                </Badge>
                <div className="flex-1 space-y-2">
                  <h4 className="font-semibold">{step.title}</h4>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                  <div className="bg-muted/20 rounded border p-3">
                    <pre className="text-xs font-mono text-foreground whitespace-pre-wrap">{step.command}</pre>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Training Configuration */}
        <div>
          <h4 className="text-sm font-semibold mb-3">Training Configuration</h4>
          <div className="bg-muted/20 rounded-lg p-4 space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Algorithm:</span>
                <div className="font-mono mt-1">LightGBM Gradient Boosting</div>
              </div>
              <div>
                <span className="text-muted-foreground">Validation Split:</span>
                <div className="font-mono mt-1">80% train / 20% test</div>
              </div>
              <div>
                <span className="text-muted-foreground">Cross Validation:</span>
                <div className="font-mono mt-1">5-fold stratified</div>
              </div>
              <div>
                <span className="text-muted-foreground">Early Stopping:</span>
                <div className="font-mono mt-1">50 rounds</div>
              </div>
            </div>
          </div>
        </div>

        {/* Best Practices */}
        <div>
          <h4 className="text-sm font-semibold mb-3">Best Practices</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-start space-x-2">
              <div className="w-1.5 h-1.5 rounded-full bg-chart-2 mt-2 flex-shrink-0" />
              <span>
                <strong>Data Quality:</strong> Ensure balanced representation of all application types in training data
              </span>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-1.5 h-1.5 rounded-full bg-chart-2 mt-2 flex-shrink-0" />
              <span>
                <strong>Feature Engineering:</strong> Include recent network patterns and emerging application types
              </span>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-1.5 h-1.5 rounded-full bg-chart-2 mt-2 flex-shrink-0" />
              <span>
                <strong>Validation:</strong> Test the new model on recent traffic before deploying to production
              </span>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-1.5 h-1.5 rounded-full bg-chart-2 mt-2 flex-shrink-0" />
              <span>
                <strong>Backup:</strong> Always backup the current model before deploying a new version
              </span>
            </div>
          </div>
        </div>

        {/* Warning */}
        <Alert variant="destructive">
          <AlertTitle>Important Notice</AlertTitle>
          <AlertDescription className="text-sm">
            Model retraining will temporarily affect classification performance. Schedule retraining during low-traffic
            periods and monitor system performance after deployment.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
