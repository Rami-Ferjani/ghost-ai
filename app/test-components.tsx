import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

export default function TestComponents() {
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Design System Test</h1>

      <Button>Click me</Button>

      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card Description</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Card Content</p>
        </CardContent>
        <CardFooter>
          <p>Card Footer</p>
        </CardFooter>
      </Card>

      <Input placeholder="Type something..." />

      <Tabs defaultValue="account">
        <TabsList>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
        </TabsList>
        <TabsContent value="account">Account Content</TabsContent>
        <TabsContent value="password">Password Content</TabsContent>
      </Tabs>

      <Textarea placeholder="Type your message here." />

      <ScrollArea className="h-32 w-48 rounded-md border p-4">
        <div className="space-y-2">
          {[...Array(20)].map((_, i) => (
            <div key={i}>Item {i + 1}</div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

// Add to app/layout.tsx's metadata to make this page accessible
// You can test by visiting /test-components