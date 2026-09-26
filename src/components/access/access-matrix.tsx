import { ACCESS_MATRIX, ROLE_PERMISSIONS, TOURNAMENT_ROLES } from "@/lib/permissions";

/** Read-only overview of what each tournament role can do. Workspace Owner/Admin get everything (Admin cannot delete tournaments). */
export function AccessMatrix() {
  return (
    <details className="surface-card p-4">
      <summary className="cursor-pointer text-sm font-semibold">What can each role do?</summary>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-muted-foreground">
              <th className="py-1.5 text-left font-medium">Permission</th>
              <th className="px-2 font-medium">Workspace Owner</th>
              <th className="px-2 font-medium">Workspace Admin</th>
              {TOURNAMENT_ROLES.map((r) => (
                <th key={r.value} className="px-2 font-medium">
                  {r.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ACCESS_MATRIX.map((row) => (
              <tr key={row.perm} className="border-t border-border/60">
                <td className="py-1.5">{row.label}</td>
                <td className="text-center text-success">✓</td>
                <td className="text-center">
                  {row.perm === "tournament.delete" ? "—" : <span className="text-success">✓</span>}
                </td>
                {TOURNAMENT_ROLES.map((r) => (
                  <td key={r.value} className="text-center">
                    {ROLE_PERMISSIONS[r.value]?.includes(row.perm) ? (
                      <span className="text-success">✓</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
